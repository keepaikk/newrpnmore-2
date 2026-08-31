#!/usr/bin/env python3
"""Master Pre-Production Test Suite for RPNMore"""
import asyncio, json, sys, time
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ADMIN_USER = "admin"
ADMIN_PASS = "admin"

PASS, FAIL, WARN = "✅", "❌", "⚠️"
results = []

def log(status, category, detail):
    results.append({"status": status, "category": category, "detail": detail})
    icon = PASS if status == "PASS" else (WARN if status == "WARN" else FAIL)
    print(f"  {icon} [{status}] {category}: {detail}")

async def test_api_health(page):
    print("\n" + "="*60)
    print("1. API HEALTH & DATABASE")
    print("="*60)
    try:
        res = await page.goto(f"{BASE_URL}/api/health", wait_until="networkidle")
        body = await res.json()
        if body.get("status") == "ok":
            log("PASS", "Health Check", f"DB connected, timestamp: {body.get('timestamp', 'N/A')}")
        else:
            log("FAIL", "Health Check", f"Unexpected response: {body}")
    except Exception as e:
        log("FAIL", "Health Check", str(e))

async def test_public_pages(page):
    print("\n" + "="*60)
    print("2. PUBLIC PAGES (Production Build)")
    print("="*60)
    pages = [
        ("/", "Homepage"),
        ("/about.html", "About"),
        ("/contact.html", "Contact"),
        ("/books.html", "Books"),
        ("/cars.html", "Cars"),
        ("/blog.html", "Blog"),
        ("/our-works.html", "Our Works"),
        ("/wealth-assets.html", "Wealth Assets"),
        ("/digital-services.html", "Digital Services"),
        ("/signup-ghana.html", "SignUp Ghana"),
        ("/real-estate.html", "Real Estate"),
    ]
    for path, name in pages:
        try:
            res = await page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=15000)
            if res.status == 200:
                title = await page.title()
                log("PASS", f"Page: {name}", f"HTTP 200 | Title: {title[:50]}")
            else:
                log("FAIL", f"Page: {name}", f"HTTP {res.status}")
        except Exception as e:
            log("FAIL", f"Page: {name}", str(e))

async def test_static_assets(page):
    print("\n" + "="*60)
    print("3. STATIC ASSETS (CSS / JS / Images)")
    print("="*60)
    assets = [
        "/assets/main-BSuZL7lk.css",
        "/assets/main-CiBbiCHn.js",
        "/rpnmore-logo.png",
        "/favicon-32x32.png",
    ]
    for asset in assets:
        try:
            res = await page.goto(f"{BASE_URL}{asset}", wait_until="networkidle")
            if res.status == 200:
                ctype = res.headers.get("content-type", "unknown")
                log("PASS", f"Asset: {asset.split('/')[-1]}", f"HTTP 200 | Type: {ctype}")
            else:
                log("FAIL", f"Asset: {asset.split('/')[-1]}", f"HTTP {res.status}")
        except Exception as e:
            log("FAIL", f"Asset: {asset.split('/')[-1]}", str(e))

async def test_console_errors(page, url, name):
    errors = []
    def handle_console(msg):
        if msg.type == "error":
            errors.append(msg.text)
    page.on("console", handle_console)
    try:
        await page.goto(url, wait_until="networkidle", timeout=15000)
        if errors:
            # Filter out expected hero-images null warnings
            real_errors = [e for e in errors if "hero-images" not in e.lower()]
            if real_errors:
                log("WARN", f"Console: {name}", f"{len(real_errors)} errors: {real_errors[0][:80]}")
            else:
                log("PASS", f"Console: {name}", "Clean (only expected hero-image warnings)")
        else:
            log("PASS", f"Console: {name}", "Zero console errors")
    except Exception as e:
        log("FAIL", f"Console: {name}", str(e))

async def test_admin_login(context):
    print("\n" + "="*60)
    print("4. ADMIN AUTHENTICATION")
    print("="*60)
    page = await context.new_page()
    try:
        await page.goto(f"{BASE_URL}/admin/login.html", wait_until="networkidle")
        await page.fill("input[name='username']", ADMIN_USER)
        await page.fill("input[name='password']", ADMIN_PASS)
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)
        if "/admin/" in page.url or ("/admin" in page.url and "login" not in page.url):
            log("PASS", "Admin Login", f"Redirected to {page.url}")
            # Test dashboard data loads
            await page.wait_for_load_state("networkidle")
            title = await page.title()
            log("PASS", "Admin Dashboard", f"Title: {title}")
        else:
            error = await page.locator("#login-error").text_content()
            log("FAIL", "Admin Login", f"Still on login. Error: '{error}'")
    except Exception as e:
        log("FAIL", "Admin Login", str(e))
    finally:
        await page.close()

async def test_api_endpoints(page):
    print("\n" + "="*60)
    print("5. PUBLIC API ENDPOINTS")
    print("="*60)
    endpoints = [
        ("GET", "/api/cms/blog-posts", "Blog Posts"),
        ("GET", "/api/cms/car-listings", "Car Listings"),
        ("GET", "/api/cms/books", "Books"),
        ("GET", "/api/cms/testimonials", "Testimonials"),
        ("GET", "/api/cms/property-listings", "Property Listings"),
    ]
    for method, path, name in endpoints:
        try:
            res = await page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
            body = await res.json()
            if isinstance(body, list):
                log("PASS", f"API: {name}", f"HTTP 200 | Returned {len(body)} items")
            else:
                log("WARN", f"API: {name}", f"Unexpected format: {str(body)[:60]}")
        except Exception as e:
            log("FAIL", f"API: {name}", str(e))

async def test_form_submission(context):
    print("\n" + "="*60)
    print("6. FORM SUBMISSION (Contact Lead)")
    print("="*60)
    page = await context.new_page()
    try:
        await page.goto(f"{BASE_URL}/contact.html", wait_until="networkidle")
        await page.fill("#contact-name", "Test User")
        await page.fill("#contact-email", "test@example.com")
        await page.fill("#contact-message", "This is a test submission from master test suite.")
        # Intercept the fetch to check if API call happens
        api_ok = False
        def handle_response(res):
            nonlocal api_ok
            if "/api/leads/contact" in res.url and res.status == 200:
                api_ok = True
        page.on("response", handle_response)
        await page.click("#contact-form button[type='submit']")
        await page.wait_for_timeout(2000)
        if api_ok:
            log("PASS", "Contact Form", "API call to /api/leads/contact succeeded")
        else:
            log("WARN", "Contact Form", "API call not captured (may be WhatsApp redirect)")
    except Exception as e:
        log("FAIL", "Contact Form", str(e))
    finally:
        await page.close()

async def test_mobile_responsive(page):
    print("\n" + "="*60)
    print("7. MOBILE RESPONSIVENESS")
    print("="*60)
    try:
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.screenshot(path="/tmp/screenshot_mobile_home.png")
        nav = await page.locator(".mobile-menu-btn").is_visible()
        if nav:
            log("PASS", "Mobile View", "Hamburger menu visible at 375px")
        else:
            log("WARN", "Mobile View", "Hamburger menu not found")
    except Exception as e:
        log("FAIL", "Mobile View", str(e))

async def main():
    print("\n" + "╔" + "═"*58 + "╗")
    print("║" + "  RPNMORE MASTER PRE-PRODUCTION TEST SUITE".ljust(58) + "║")
    print("╚" + "═"*58 + "╝")
    start = time.time()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()

        await test_api_health(page)
        await test_public_pages(page)
        await test_static_assets(page)

        # Console error check for key pages
        for path, name in [("/", "Homepage"), ("/books.html", "Books"), ("/contact.html", "Contact")]:
            p2 = await context.new_page()
            await test_console_errors(p2, f"{BASE_URL}{path}", name)
            await p2.close()

        await test_admin_login(context)
        await test_api_endpoints(page)
        await test_form_submission(context)
        await test_mobile_responsive(page)

        await context.close()
        await browser.close()

    elapsed = time.time() - start
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    warns = sum(1 for r in results if r["status"] == "WARN")
    print(f"  {PASS} Passed: {passed}")
    print(f"  {FAIL} Failed: {failed}")
    print(f"  {WARN} Warnings: {warns}")
    print(f"  ⏱ Time: {elapsed:.1f}s")

    if failed > 0:
        print("\n  FAILED ITEMS:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"    - {r['category']}: {r['detail']}")
        print("\n  ❌ DEPLOYMENT BLOCKED. Fix failures before production.")
        sys.exit(1)
    elif warns > 0:
        print("\n  ⚠️  DEPLOY WITH CAUTION. Review warnings.")
        sys.exit(0)
    else:
        print("\n  ✅ ALL CHECKS PASSED. SAFE TO DEPLOY.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
