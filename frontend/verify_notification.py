import time
from playwright.sync_api import sync_playwright

def test_notification():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to app
        # Note: In the real environment we would need the dev server port.
        # Since I cannot easily know when the dev server is ready or what port it picked if 5173 is busy (though it should be 5173),
        # I will try 5173.
        try:
            page.goto("http://localhost:5173", timeout=10000)

            # Wait for app to load
            page.wait_for_selector(".app-container", timeout=10000)

            # Trigger a notification
            # We can trigger a notification by clicking the "Share" button which usually triggers a success toast
            share_btn = page.get_by_role("button", name="Share")
            if share_btn.count() > 0:
                share_btn.click()

                # Wait for notification
                notification = page.locator(".notification")
                notification.wait_for(state="visible", timeout=5000)

                # Check accessibility attributes
                role = notification.get_attribute("role")
                aria_live = notification.get_attribute("aria-live")

                print(f"Notification Role: {role}")
                print(f"Notification Aria-Live: {aria_live}")

                # Check close button label
                close_btn = notification.locator(".notification-close")
                aria_label = close_btn.get_attribute("aria-label")
                print(f"Close Button Label: {aria_label}")

                # Hover to test pause (visual verification via screenshot might be hard, but we can verify it stays)
                notification.hover()
                time.sleep(2) # Wait a bit

                # Take screenshot
                page.screenshot(path="frontend/notification_verify.png")
                print("Screenshot taken")

            else:
                print("Share button not found")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_notification()
