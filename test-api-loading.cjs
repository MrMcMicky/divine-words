const puppeteer = require('puppeteer');

async function testApiLoading() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log('Browser error:', error.message);
  });
  
  console.log('🔍 Testing Divine Words - API Loading');
  
  try {
    // Navigate to the website
    await page.goto('https://divine-words.assistent.my.id', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded successfully');
    
    // Wait for potential errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check network requests
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/bible/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });
    
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📡 API Calls made:', apiCalls.length);
    apiCalls.forEach(call => {
      console.log(`- ${call.url}: ${call.status} (${call.ok ? 'OK' : 'FAILED'})`);
    });
    
    // Check for loading state
    const loadingState = await page.evaluate(() => {
      const dailyCard = Array.from(document.querySelectorAll('.romantic-card')).find(card => {
        const h2 = card.querySelector('h2');
        return h2 && (h2.textContent.includes('Täglicher') || h2.textContent.includes('Daily'));
      });
      
      if (!dailyCard) return 'No daily card found';
      
      const loadingText = dailyCard.textContent.includes('Lädt...') || dailyCard.textContent.includes('Loading...');
      const hasContent = dailyCard.querySelector('.verse-text') !== null;
      const errorMessage = dailyCard.querySelector('.bg-red-50');
      
      return {
        loading: loadingText,
        hasContent: hasContent,
        hasError: errorMessage !== null,
        errorText: errorMessage ? errorMessage.textContent : null,
        fullText: dailyCard.textContent.replace(/\s+/g, ' ').trim()
      };
    });
    
    console.log('\n📋 Daily Verse Card State:');
    console.log('- Loading:', loadingState.loading);
    console.log('- Has content:', loadingState.hasContent);
    console.log('- Has error:', loadingState.hasError);
    if (loadingState.errorText) {
      console.log('- Error message:', loadingState.errorText);
    }
    console.log('- Card text preview:', loadingState.fullText.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApiLoading().catch(console.error);