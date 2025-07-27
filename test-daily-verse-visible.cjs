const puppeteer = require('puppeteer');

async function testDailyVerseVisible() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('🔍 Testing Divine Words - Daily Verse Always Visible');
  
  try {
    // Navigate to the website
    await page.goto('https://divine-words.assistent.my.id', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded successfully');
    
    // Take initial screenshot
    await page.screenshot({ path: 'daily-verse-test-initial.png', fullPage: true });
    
    // Wait for content to load
    await page.waitForSelector('.romantic-card', { timeout: 10000 });
    
    // Get all romantic cards
    const cards = await page.$$('.romantic-card');
    console.log(`Found ${cards.length} romantic cards`);
    
    // Check for daily verse section
    let dailyVerseSection = null;
    let searchSection = null;
    
    try {
      const cardHeaders = await page.$$eval('.romantic-card h2', headers => 
        headers.map(h => h.textContent.trim())
      );
      console.log('Card headers found:', cardHeaders);
      
      dailyVerseSection = cardHeaders.find(h => h.includes('Täglicher') || h.includes('Daily'));
      searchSection = cardHeaders.find(h => h.includes('suchen') || h.includes('Search'));
    } catch (e) {
      console.log('Could not find headers:', e.message);
    }
    
    console.log(`📖 Daily verse section: ${dailyVerseSection ? `"${dailyVerseSection}"` : 'NOT FOUND'}`);
    console.log(`🔍 Search section: ${searchSection ? `"${searchSection}"` : 'NOT FOUND'}`);
    
    // Check if both sections are visible
    const dailyVerseVisible = dailyVerseSection !== null;
    const searchVisible = searchSection !== null;
    
    console.log(`\n📊 Visibility Status:`);
    console.log(`- Daily Verse Section: ${dailyVerseVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    console.log(`- Search Section: ${searchVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    
    // Check that there's no toggle button
    const toggleButtonExists = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent;
        if (text.includes('Tagesvers zeigen') || text.includes('Show Daily Verse')) {
          return true;
        }
      }
      return false;
    });
    console.log(`\n🔘 Toggle button: ${toggleButtonExists ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
    
    // Wait a bit for daily verse to load from API
    console.log('\n⏳ Waiting for daily verse to load from API...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if daily verse content is displayed
    const dailyVerseContent = await page.evaluate(() => {
      // Find the card that contains daily verse
      const cards = document.querySelectorAll('.romantic-card');
      let verseCard = null;
      
      for (const card of cards) {
        const header = card.querySelector('h2');
        if (header && (header.textContent.includes('Täglicher') || header.textContent.includes('Daily'))) {
          verseCard = card;
          break;
        }
      }
      
      if (!verseCard) return null;
      
      const verseText = verseCard.querySelector('.verse-text');
      const reference = verseCard.querySelector('.text-romantic-rose');
      
      return {
        hasText: verseText && verseText.textContent.trim().length > 0,
        hasReference: reference && reference.textContent.trim().length > 0,
        text: verseText ? verseText.textContent.trim().substring(0, 50) + '...' : '',
        reference: reference ? reference.textContent.trim() : ''
      };
    });
    
    if (dailyVerseContent) {
      console.log(`\n📖 Daily Verse Content:`);
      console.log(`- Has verse text: ${dailyVerseContent.hasText ? '✅' : '❌'}`);
      console.log(`- Has reference: ${dailyVerseContent.hasReference ? '✅' : '❌'}`);
      if (dailyVerseContent.hasText) {
        console.log(`- Text preview: "${dailyVerseContent.text}"`);
        console.log(`- Reference: "${dailyVerseContent.reference}"`);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'daily-verse-test-final.png', fullPage: true });
    
    // Test summary
    console.log('\n========== TEST SUMMARY ==========');
    const success = dailyVerseVisible && searchVisible && !toggleButtonExists && 
                   dailyVerseContent && dailyVerseContent.hasText;
    console.log(`Overall Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('- Daily verse section is visible: ' + (dailyVerseVisible ? '✅' : '❌'));
    console.log('- Search section is visible: ' + (searchVisible ? '✅' : '❌'));
    console.log('- Daily verse has content: ' + (dailyVerseContent?.hasText ? '✅' : '❌'));
    console.log('- Toggle button removed: ' + (!toggleButtonExists ? '✅' : '❌'));
    console.log('==================================\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDailyVerseVisible().catch(console.error);