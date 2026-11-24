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
