"""
Tests for the PyMuPDF PDF processing service.

Validates text extraction, geometry coordinate mapping, and fallback
behavior when exact quotes cannot be located in the document.
"""
import pytest
from unittest.mock import patch, MagicMock
from services.pdf_processor import find_exact_quote_coordinates, extract_text_from_pdf


class TestExtractTextFromPDF:
    """Test suite for the extract_text_from_pdf function."""

    @patch("services.pdf_processor.fitz.open")
    def test_extracts_text_from_single_page(self, mock_fitz_open: MagicMock) -> None:
        """Verify text extraction from a single-page PDF."""
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Tenant agrees to indemnify Landlord."
        mock_doc = MagicMock()
        mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
        mock_fitz_open.return_value = mock_doc

        result = extract_text_from_pdf(b"fake_pdf_bytes")

        assert result == "Tenant agrees to indemnify Landlord."
        mock_doc.close.assert_called_once()

    @patch("services.pdf_processor.fitz.open")
    def test_extracts_text_from_multiple_pages(self, mock_fitz_open: MagicMock) -> None:
        """Verify text extraction concatenates text from all pages."""
        page1 = MagicMock()
        page1.get_text.return_value = "Page 1 text. "
        page2 = MagicMock()
        page2.get_text.return_value = "Page 2 text."
        mock_doc = MagicMock()
        mock_doc.__iter__ = MagicMock(return_value=iter([page1, page2]))
        mock_fitz_open.return_value = mock_doc

        result = extract_text_from_pdf(b"fake_pdf_bytes")

        assert "Page 1 text." in result
        assert "Page 2 text." in result

    @patch("services.pdf_processor.fitz.open")
    def test_handles_empty_pdf(self, mock_fitz_open: MagicMock) -> None:
        """Verify empty PDF returns empty string."""
        mock_doc = MagicMock()
        mock_doc.__iter__ = MagicMock(return_value=iter([]))
        mock_fitz_open.return_value = mock_doc

        result = extract_text_from_pdf(b"fake_pdf_bytes")

        assert result == ""


class TestFindExactQuoteCoordinates:
    """Test suite for the find_exact_quote_coordinates geometry mapper."""

    @patch("services.pdf_processor.fitz.open")
    def test_finds_exact_quote_on_first_page(self, mock_fitz_open: MagicMock) -> None:
        """Verify exact string match returns correct page number and quads."""
        mock_quad = MagicMock()
        mock_quad.ul.x, mock_quad.ul.y = 10.0, 20.0
        mock_quad.ur.x, mock_quad.ur.y = 100.0, 20.0
        mock_quad.ll.x, mock_quad.ll.y = 10.0, 35.0
        mock_quad.lr.x, mock_quad.lr.y = 100.0, 35.0

        mock_page = MagicMock()
        mock_page.search_for.return_value = [mock_quad]
        mock_doc = MagicMock()
        mock_doc.__len__ = MagicMock(return_value=1)
        mock_doc.__getitem__ = MagicMock(return_value=mock_page)
        mock_fitz_open.return_value = mock_doc

        result = find_exact_quote_coordinates(b"fake_pdf", "indemnify")

        assert result["page_number"] == 1
        assert len(result["quads"]) == 1
        assert result["quads"][0]["ul"] == [10.0, 20.0]
        assert result["quads"][0]["lr"] == [100.0, 35.0]

    @patch("services.pdf_processor.fitz.open")
    def test_fallback_to_prefix_search(self, mock_fitz_open: MagicMock) -> None:
        """Verify fallback to first 30 chars when exact match fails."""
        mock_quad = MagicMock()
        mock_quad.ul.x, mock_quad.ul.y = 5.0, 10.0
        mock_quad.ur.x, mock_quad.ur.y = 50.0, 10.0
        mock_quad.ll.x, mock_quad.ll.y = 5.0, 25.0
        mock_quad.lr.x, mock_quad.lr.y = 50.0, 25.0

        mock_page = MagicMock()
        # First search (exact) returns empty, second search (prefix) returns match
        mock_page.search_for.side_effect = [[], [mock_quad]]
        mock_doc = MagicMock()
        mock_doc.__len__ = MagicMock(return_value=1)
        mock_doc.__getitem__ = MagicMock(return_value=mock_page)
        mock_fitz_open.return_value = mock_doc

        long_quote = "This is a very long quote that exceeds thirty characters for testing"
        result = find_exact_quote_coordinates(b"fake_pdf", long_quote)

        assert result["page_number"] == 1
        assert len(result["quads"]) == 1

    @patch("services.pdf_processor.fitz.open")
    def test_returns_empty_geometry_when_not_found(self, mock_fitz_open: MagicMock) -> None:
        """Verify graceful fallback with empty quads when quote is absent."""
        mock_page = MagicMock()
        mock_page.search_for.return_value = []
        mock_doc = MagicMock()
        mock_doc.__len__ = MagicMock(return_value=1)
        mock_doc.__getitem__ = MagicMock(return_value=mock_page)
        mock_fitz_open.return_value = mock_doc

        result = find_exact_quote_coordinates(b"fake_pdf", "nonexistent text")

        assert result["page_number"] == 1
        assert result["quads"] == []
