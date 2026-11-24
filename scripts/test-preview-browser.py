from playwright.sync_api import sync_playwright

BASE = "https://current-focus-development.sohelrahman118.workers.dev"
PAGES = ["/", "/bn/index.html", "/admin.html", "/quote-response.html"]
VIEWPORTS = [{"width": 390, "height": 844}, {"width": 1440, "height": 900}]

def main():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for viewport in VIEWPORTS:
            page = browser.new_page(viewport=viewport)
            page_errors = []
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            for path in PAGES:
                response = page.goto(BASE + path, wait_until="domcontentloaded", timeout=30000)
                if response is None or response.status != 200:
                    failures.append(f"{viewport['width']}px {path}: expected HTTP 200")
                    continue
                page.wait_for_load_state("load", timeout=15000)
                title = page.title().strip()
                body_text = page.locator("body").inner_text().strip()
                if not title:
                    failures.append(f"{viewport['width']}px {path}: document title is empty")
                if len(body_text) < 20:
                    failures.append(f"{viewport['width']}px {path}: body text is unexpectedly short")
                if path == "/admin.html":
                    checks = [
                        ("#login-panel", "visible", True),
                        ("#login-form input[name=email]", "count", 1),
                        ("#login-form input[name=password]", "count", 1),
                        ("#mfa-enroll-panel", "hidden", True),
                        ("#mfa-verify-panel", "hidden", True),
                        ("#mfa-recovery-panel", "hidden", True),
                        ("#dashboard", "hidden", True),
                    ]
                    for selector, mode, expected in checks:
                        locator = page.locator(selector)
                        actual = locator.is_visible() if mode == "visible" else (locator.count() if mode == "count" else not locator.is_visible())
                        if actual != expected:
                            failures.append(f"{viewport['width']}px /admin.html: {selector} {mode} expected {expected}, got {actual}")
                    enroll_copy = page.locator("#mfa-enroll-panel").text_content() or ""
                    recovery_copy = page.locator("#mfa-recovery-panel").text_content() or ""
                    if "Set up two-step verification" not in enroll_copy or "দ্বি-ধাপ যাচাইকরণ সেটআপ" not in enroll_copy or "recovery codes" not in recovery_copy.lower() or "রিকভারি কোড" not in recovery_copy:
                        failures.append(f"{viewport['width']}px /admin.html: bilingual MFA enrollment/recovery content missing")
                dimensions = page.evaluate("({width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth})")
                if dimensions["scroll"] > dimensions["width"] + 2:
                    failures.append(f"{viewport['width']}px {path}: horizontal overflow ({dimensions['scroll']} > {dimensions['width']})")
                if page_errors:
                    failures.extend(f"{viewport['width']}px {path}: uncaught browser error: {error}" for error in page_errors)
                    page_errors.clear()
                print(f"PASS viewport={viewport['width']} path={path} title_present={bool(title)} body_chars={len(body_text)} horizontal_overflow={dimensions['scroll'] > dimensions['width'] + 2}")
            page.close()
        browser.close()
    if failures:
        print("Browser smoke failures:")
        for failure in failures:
            print(" - " + failure)
        raise SystemExit(1)
    print("Preview browser smoke tests passed.")

if __name__ == "__main__":
    main()
