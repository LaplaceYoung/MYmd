import json
import logging
from playwright.sync_api import sync_playwright
import subprocess
import time

logging.basicConfig(level=logging.INFO)

def run():
    # Note: Tauri apps can be debugged by passing a debugging port if built with devtools
    # Since we need to see why it fails in release, we should probably check if DevTools is enabled in tauri.conf.json
    # or just use standard debug techniques.
    
    # For now, let's just launch the executable and see if it creates a debug.log or prints to stdout
    process = subprocess.Popen(
        [r"f:\简历项目\MYmd\release\MYmd_v1.1.2.exe", r"f:\简历项目\MYmd\release\test.md"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    time.sleep(3)
    
    # Check if process is still running
    if process.poll() is None:
        logging.info("Process is running.")
        process.kill()
    else:
        logging.info("Process exited.")
        
    stdout, stderr = process.communicate()
    logging.info(f"STDOUT: {stdout}")
    logging.info(f"STDERR: {stderr}")

if __name__ == "__main__":
    run()
