import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {"xyz", "top", "icu", "zip", "mov", "click", "work", "gq", "tk"}

def extract_features(url: str) -> dict:
    u = url.strip()
    parsed = urlparse(u if "://" in u else "http://" + u)
    host = parsed.netloc.lower()
    path = parsed.path.lower()

    is_ip = 1 if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host.split(":")[0]) else 0
    tld = host.split(".")[-1].split(":")[0] if "." in host else ""
    has_https = 1 if parsed.scheme == "https" else 0

    return {
        "url_length": len(u),
        "num_dots": u.count("."),
        "num_hyphens": u.count("-"),
        "num_at": u.count("@"),
        "num_qm": u.count("?"),
        "num_eq": u.count("="),
        "num_slashes": u.count("/"),
        "num_digits": sum(c.isdigit() for c in u),
        "has_ip": is_ip,
        "has_https": has_https,
        "suspicious_tld": 1 if tld in SUSPICIOUS_TLDS else 0,
        "path_length": len(path),
        "host_length": len(host),
    }
