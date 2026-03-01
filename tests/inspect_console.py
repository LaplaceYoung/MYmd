import json
import logging
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO)

def run():
    with sync_playwright() as p:
        # We assume the dev server is running on localhost:5173
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We will expose a callback to get console messages
        messages = []
        page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
        
        logging.info("Navigating to app...")
        page.goto("http://localhost:5173", wait_until="networkidle")
        
        # Give it a second to run the hooks
        page.wait_for_timeout(2000)
        
        logging.info("Console messages:")
        for msg in messages:
            logging.info(msg)
            
        browser.close()

if __name__ == "__main__":
    run()
