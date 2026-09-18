"""
Rate limiter configuration for the LegalEase AI backend.

Implements an IP-based token bucket rate limiter using SlowAPI
to protect Gemini API quotas from abuse and prevent DDoS attacks.
Default limit: 5 requests per minute per unique client IP address.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["5/minute"])
