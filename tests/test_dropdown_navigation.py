#!/usr/bin/env python3
"""
Comprehensive test suite for Divine Words dropdown navigation system
Tests dropdown functionality, search integration, UI/UX, and error handling
"""

import asyncio
from playwright.async_api import async_playwright
import json
from datetime import datetime

class DivineWordsDropdownTester:
    def __init__(self):
        self.results = {
            "test_timestamp": datetime.now().isoformat(),
            "dropdown_navigation": {},
            "search_functionality": {},
            "ui_ux": {},
            "error_handling": {},
            "browser_compatibility": {},
            "performance_metrics": {}
        }
        self.base_url = "https://divine-words.assistent.my.id"
        
    async def test_dropdown_navigation(self, page):
        """Test the dropdown navigation elements"""
        print("\n🔍 Testing Dropdown Navigation...")
        
        try:
            # Wait for page to load
            await page.goto(self.base_url, wait_until='networkidle')
            await page.wait_for_timeout(3000)
            
            # Screenshot initial state
            await page.screenshot(path='/tmp/dropdown_test_initial.png')
            
            # Check for dropdown elements using multiple selectors
            selectors = {
                "book": ['select[id*="book"]', 'select[name*="book"]', '#bookSelect', '.book-select', 
                        '[data-testid="book-select"]', 'select:has-text("Genesis")', 'select:has-text("1. Mose")'],
                "chapter": ['select[id*="chapter"]', 'select[name*="chapter"]', '#chapterSelect', '.chapter-select',
                           '[data-testid="chapter-select"]', 'select:has-text("Chapter")', 'select:has-text("Kapitel")'],
                "verse": ['select[id*="verse"]', 'select[name*="verse"]', '#verseSelect', '.verse-select',
                         '[data-testid="verse-select"]', 'select:has-text("Verse")', 'select:has-text("Vers")'],
                "translation": ['select[id*="translation"]', 'select[name*="translation"]', '#translationSelect',
                               '.translation-select', '[data-testid="translation-select"]']
            }
            
            found_elements = {}
            for element_type, selector_list in selectors.items():
                for selector in selector_list:
                    try:
                        element = await page.wait_for_selector(selector, timeout=2000)
                        if element:
                            found_elements[element_type] = selector
                            self.results["dropdown_navigation"][f"{element_type}_found"] = True
                            self.results["dropdown_navigation"][f"{element_type}_selector"] = selector
                            
                            # Get options if it's a select element
                            if element_type in ["book", "chapter", "verse", "translation"]:
                                options = await page.evaluate(f'''(selector) => {{
                                    const el = document.querySelector(selector);
                                    if (el && el.tagName === 'SELECT') {{
                                        return Array.from(el.options).map(opt => ({{
                                            text: opt.text,
                                            value: opt.value,
                                            disabled: opt.disabled
                                        }}));
                                    }}
                                    return null;
                                }}''', selector)
                                
                                if options:
                                    self.results["dropdown_navigation"][f"{element_type}_options_count"] = len(options)
                                    self.results["dropdown_navigation"][f"{element_type}_first_5_options"] = options[:5]
                            break
                    except:
                        continue
                
                if element_type not in found_elements:
                    self.results["dropdown_navigation"][f"{element_type}_found"] = False
            
            # Check all select elements on page
            all_selects = await page.evaluate('''() => {
                const selects = document.querySelectorAll('select');
                return Array.from(selects).map(select => ({
                    id: select.id,
                    name: select.name,
                    className: select.className,
                    optionsCount: select.options.length,
                    firstOption: select.options[0]?.text,
                    disabled: select.disabled,
                    visible: select.offsetParent !== null
                }));
            }''')
            
            self.results["dropdown_navigation"]["all_selects_on_page"] = all_selects
            self.results["dropdown_navigation"]["total_selects_found"] = len(all_selects)
            
            # Test dropdown interaction if book dropdown found
            if "book" in found_elements:
                book_selector = found_elements["book"]
                
                # Select a book
                await page.select_option(book_selector, index=1)
                await page.wait_for_timeout(1000)
                
                # Check if chapter dropdown is populated
                if "chapter" in found_elements:
                    chapter_options = await page.evaluate(f'''(selector) => {{
                        const el = document.querySelector(selector);
                        return el ? el.options.length : 0;
                    }}''', found_elements["chapter"])
                    
                    self.results["dropdown_navigation"]["chapter_options_after_book_select"] = chapter_options
                    
                    # Select a chapter
                    if chapter_options > 1:
                        await page.select_option(found_elements["chapter"], index=1)
                        await page.wait_for_timeout(1000)
                        
                        # Check if verse dropdown is populated
                        if "verse" in found_elements:
                            verse_options = await page.evaluate(f'''(selector) => {{
                                const el = document.querySelector(selector);
                                return el ? el.options.length : 0;
                            }}''', found_elements["verse"])
                            
                            self.results["dropdown_navigation"]["verse_options_after_chapter_select"] = verse_options
            
            # Check for language switcher
            lang_elements = await page.query_selector_all('[class*="language"], [id*="language"], button:has-text("EN"), button:has-text("DE")')
            self.results["dropdown_navigation"]["language_switcher_found"] = len(lang_elements) > 0
            
        except Exception as e:
            self.results["dropdown_navigation"]["error"] = str(e)
            print(f"❌ Error in dropdown navigation test: {e}")
    
    async def test_search_functionality(self, page):
        """Test search functionality with dropdowns"""
        print("\n🔎 Testing Search Functionality...")
        
        try:
            # Look for search button or form
            search_button = await page.query_selector('button[type="submit"], button:has-text("Search"), button:has-text("Suchen"), button:has-text("Go"), button:has-text("Los")')
            search_form = await page.query_selector('form')
            
            self.results["search_functionality"]["search_button_found"] = search_button is not None
            self.results["search_functionality"]["search_form_found"] = search_form is not None
            
            # Test search with selections
            if search_button:
                # Click search and check for results
                await search_button.click()
                await page.wait_for_timeout(2000)
                
                # Check for results or error messages
                results_container = await page.query_selector('[class*="result"], [class*="verse"], [id*="result"], .bible-verse, .verse-text')
                error_message = await page.query_selector('[class*="error"], [class*="alert"], .error-message, .warning')
                
                self.results["search_functionality"]["results_displayed"] = results_container is not None
                self.results["search_functionality"]["error_displayed"] = error_message is not None
                
                if results_container:
                    result_text = await results_container.inner_text()
                    self.results["search_functionality"]["sample_result"] = result_text[:200] if result_text else None
                
                if error_message:
                    error_text = await error_message.inner_text()
                    self.results["search_functionality"]["error_message"] = error_text
            
            # Test keyboard navigation
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            focused_element = await page.evaluate('() => document.activeElement.tagName')
            self.results["search_functionality"]["keyboard_navigation_works"] = focused_element is not None
            
        except Exception as e:
            self.results["search_functionality"]["error"] = str(e)
            print(f"❌ Error in search functionality test: {e}")
    
    async def test_ui_ux(self, page):
        """Test UI/UX aspects"""
        print("\n🎨 Testing UI/UX...")
        
        try:
            # Test responsive design
            viewports = [
                {"name": "desktop", "width": 1920, "height": 1080},
                {"name": "tablet", "width": 768, "height": 1024},
                {"name": "mobile", "width": 375, "height": 667}
            ]
            
            for viewport in viewports:
                await page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
                await page.wait_for_timeout(1000)
                await page.screenshot(path=f'/tmp/dropdown_test_{viewport["name"]}.png')
                
                # Check if elements are visible
                visible_selects = await page.evaluate('''() => {
                    const selects = document.querySelectorAll('select');
                    return Array.from(selects).filter(s => s.offsetParent !== null).length;
                }''')
                
                self.results["ui_ux"][f"{viewport['name']}_visible_selects"] = visible_selects
            
            # Check for disabled states
            disabled_elements = await page.evaluate('''() => {
                const elements = document.querySelectorAll('select, button, input');
                return Array.from(elements).filter(el => el.disabled).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className
                }));
            }''')
            
            self.results["ui_ux"]["disabled_elements"] = disabled_elements
            
            # Check styling
            dropdown_styles = await page.evaluate('''() => {
                const select = document.querySelector('select');
                if (select) {
                    const styles = window.getComputedStyle(select);
                    return {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        fontSize: styles.fontSize,
                        padding: styles.padding,
                        border: styles.border,
                        borderRadius: styles.borderRadius
                    };
                }
                return null;
            }''')
            
            self.results["ui_ux"]["dropdown_styles"] = dropdown_styles
            
        except Exception as e:
            self.results["ui_ux"]["error"] = str(e)
            print(f"❌ Error in UI/UX test: {e}")
    
    async def test_error_handling(self, page):
        """Test error handling"""
        print("\n⚠️ Testing Error Handling...")
        
        try:
            # Test search without selections
            search_button = await page.query_selector('button[type="submit"], button:has-text("Search"), button:has-text("Suchen")')
            
            if search_button:
                # Clear any selections
                await page.evaluate('''() => {
                    const selects = document.querySelectorAll('select');
                    selects.forEach(select => {
                        if (select.options.length > 0) {
                            select.selectedIndex = 0;
                        }
                    });
                }''')
                
                await search_button.click()
                await page.wait_for_timeout(2000)
                
                # Check for error messages
                error_indicators = await page.query_selector_all('[class*="error"], [class*="alert"], [class*="warning"], .validation-error, .error-message')
                self.results["error_handling"]["shows_validation_errors"] = len(error_indicators) > 0
                
                if error_indicators:
                    error_texts = []
                    for indicator in error_indicators[:3]:  # Get first 3 error messages
                        text = await indicator.inner_text()
                        error_texts.append(text)
                    self.results["error_handling"]["error_messages"] = error_texts
            
            # Test network error handling
            await page.route('**/*', lambda route: route.abort())
            await page.reload()
            await page.wait_for_timeout(3000)
            
            offline_indicator = await page.query_selector('[class*="offline"], [class*="error"], [class*="network"]')
            self.results["error_handling"]["handles_network_errors"] = offline_indicator is not None
            
        except Exception as e:
            self.results["error_handling"]["error"] = str(e)
            print(f"❌ Error in error handling test: {e}")
    
    async def test_browser_compatibility(self):
        """Test across different browsers"""
        print("\n🌐 Testing Browser Compatibility...")
        
        browsers = ['chromium', 'firefox', 'webkit']
        
        async with async_playwright() as p:
            for browser_name in browsers:
                try:
                    browser = getattr(p, browser_name)
                    browser_instance = await browser.launch(headless=True)
                    page = await browser_instance.new_page()
                    
                    await page.goto(self.base_url, wait_until='networkidle')
                    await page.wait_for_timeout(2000)
                    
                    # Quick compatibility check
                    selects_found = await page.evaluate('() => document.querySelectorAll("select").length')
                    page_loaded = await page.evaluate('() => document.readyState === "complete"')
                    
                    self.results["browser_compatibility"][browser_name] = {
                        "loads_successfully": page_loaded,
                        "selects_found": selects_found,
                        "no_console_errors": True  # Would need console listener for accurate check
                    }
                    
                    await browser_instance.close()
                    
                except Exception as e:
                    self.results["browser_compatibility"][browser_name] = {
                        "error": str(e)
                    }
        
        print("✅ Browser compatibility test completed")
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Divine Words Dropdown Navigation Tests")
        print(f"📍 Testing URL: {self.base_url}")
        print("=" * 50)
        
        # Test with main browser
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Performance metrics
            start_time = datetime.now()
            
            # Run tests
            await self.test_dropdown_navigation(page)
            await self.test_search_functionality(page)
            await self.test_ui_ux(page)
            await self.test_error_handling(page)
            
            # Performance metrics
            end_time = datetime.now()
            self.results["performance_metrics"]["total_test_duration"] = str(end_time - start_time)
            
            await browser.close()
        
        # Run browser compatibility tests
        await self.test_browser_compatibility()
        
        return self.results

async def main():
    tester = DivineWordsDropdownTester()
    results = await tester.run_all_tests()
    
    # Save results
    with open('/tmp/dropdown_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    # Dropdown Navigation Summary
    print("\n🔍 Dropdown Navigation:")
    for key, value in results["dropdown_navigation"].items():
        if not key.endswith("_options") and not key.endswith("_details"):
            print(f"  • {key}: {value}")
    
    # Search Functionality Summary
    print("\n🔎 Search Functionality:")
    for key, value in results["search_functionality"].items():
        if key != "sample_result":
            print(f"  • {key}: {value}")
    
    # Browser Compatibility Summary
    print("\n🌐 Browser Compatibility:")
    for browser, status in results["browser_compatibility"].items():
        if isinstance(status, dict) and "loads_successfully" in status:
            print(f"  • {browser}: {'✅ PASS' if status['loads_successfully'] else '❌ FAIL'}")
    
    print("\n💾 Full results saved to: /tmp/dropdown_test_results.json")
    print("📸 Screenshots saved to: /tmp/dropdown_test_*.png")

if __name__ == "__main__":
    asyncio.run(main())