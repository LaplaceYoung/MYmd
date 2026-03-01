from playwright.sync_api import sync_playwright
import time
import sys

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        def handle_console(msg):
            # To catch React errors
            print(f"[BROWSER CONSOLE] {msg.type}: {msg.text}")
            
        def handle_pageerror(err):
            print(f"[BROWSER ERROR] {err}")

        page.on("console", handle_console)
        page.on("pageerror", handle_pageerror)
        
        print("Navigating to http://localhost:1420")
        page.goto('http://localhost:1420')
        
        print("Waiting for load...")
        page.wait_for_selector('.title-bar', timeout=10000)
        
        print("Clicking View Tab...")
        # Ribbon view tab
        view_tab = page.locator('button.ribbon__tab', has_text="视图")
        view_tab.wait_for(state="visible")
        view_tab.click()
        
        print("Waiting for crash...")
        time.sleep(2)  # Wait for error to spit out
        
        print("Taking screenshot...")
        page.screenshot(path="crash.png")
        
        browser.close()

if __name__ == '__main__':
    main()
