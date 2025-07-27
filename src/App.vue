<template>
  <div class="min-h-screen py-8 px-4">
    <!-- Hearts decoration -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 5" :key="i" 
           class="absolute animate-float"
           :style="{ 
             left: `${Math.random() * 100}%`, 
             top: `${Math.random() * 100}%`,
             animationDelay: `${i * 1.5}s` 
           }">
        <HeartIcon class="w-8 h-8 text-romantic-pink/20" />
      </div>
    </div>

    <div class="max-w-4xl mx-auto relative z-10">
      <!-- Header -->
      <header class="text-center mb-12 animate-fade-in">
        <h1 class="font-script text-6xl text-romantic-deepRose mb-2">Divine Words</h1>
        <p class="text-romantic-rose text-lg">{{ translations[currentLang].subtitle }}</p>
      </header>

      <!-- Language Switcher -->
      <div class="flex justify-center gap-4 mb-8">
        <button 
          @click="currentLang = 'de'"
          :class="['romantic-button', currentLang === 'de' ? '' : 'opacity-70 hover:opacity-100']">
          Deutsch
        </button>
        <button 
          @click="currentLang = 'en'"
          :class="['romantic-button', currentLang === 'en' ? '' : 'opacity-70 hover:opacity-100']">
          English
        </button>
      </div>

      <!-- Daily Verse Card -->
      <div class="romantic-card mb-8">
        <h2 class="text-3xl font-script text-romantic-deepRose text-center mb-6">
          {{ translations[currentLang].dailyVerse }}
        </h2>
        
        <!-- Daily Verse Display -->
        <div v-if="dailyVerseData" class="space-y-6">
          <div class="text-center">
            <p class="verse-text mb-3">{{ dailyVerseData[currentLang].text }}</p>
            <p class="text-lg text-romantic-rose font-medium">
              {{ dailyVerseData[currentLang].reference }}
            </p>
          </div>
          
          <!-- Show both languages for daily verse -->
          <div class="border-t border-romantic-pink/20 pt-6">
            <p class="text-sm text-gray-600 text-center mb-3">
              {{ currentLang === 'de' ? 'English Version:' : 'Deutsche Version:' }}
            </p>
            <p class="text-lg text-gray-700 italic text-center">
              {{ dailyVerseData[currentLang === 'de' ? 'en' : 'de'].text }}
            </p>
          </div>
        </div>
        
        <!-- Loading state for daily verse -->
        <div v-else-if="loadingDaily" class="text-center py-8">
          <p class="text-romantic-rose animate-pulse">{{ translations[currentLang].loading }}</p>
        </div>
      </div>

      <!-- Verse Search Card -->
      <div class="romantic-card mb-8">
        <div>
          <h2 class="text-3xl font-script text-romantic-deepRose text-center mb-6">
            {{ translations[currentLang].searchTitle }}
          </h2>

          <!-- Translation Selector -->
          <div class="mb-6">
            <label class="block text-romantic-rose font-medium mb-2">
              {{ translations[currentLang].selectTranslation }}
            </label>
            <select v-model="selectedTranslation" 
                    class="w-full px-4 py-3 rounded-lg border border-romantic-pink/30 focus:border-romantic-rose focus:outline-none">
              <option v-for="trans in availableTranslations[currentLang]" 
                      :key="trans.code" 
                      :value="trans.code">
                {{ trans.name }}
              </option>
            </select>
          </div>

          <!-- Bible Reference Dropdowns -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-romantic-rose font-medium mb-2">
                {{ translations[currentLang].book }}
              </label>
              <select v-model="selectedBookIndex" 
                      class="w-full px-4 py-3 rounded-lg border border-romantic-pink/30 focus:border-romantic-rose focus:outline-none">
                <option :value="null" disabled>{{ translations[currentLang].selectBook }}</option>
                <option v-for="(book, index) in books" 
                        :key="index" 
                        :value="index">
                  {{ book.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-romantic-rose font-medium mb-2">
                {{ translations[currentLang].chapter }}
              </label>
              <select v-model="selectedChapter" 
                      :disabled="!selectedBook"
                      class="w-full px-4 py-3 rounded-lg border border-romantic-pink/30 focus:border-romantic-rose focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option :value="null" disabled>{{ translations[currentLang].selectChapter }}</option>
                <option v-for="chapter in chapters" 
                        :key="chapter" 
                        :value="chapter">
                  {{ chapter }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-romantic-rose font-medium mb-2">
                {{ translations[currentLang].verse }}
              </label>
              <select v-model="selectedVerse" 
                      :disabled="!selectedChapter"
                      class="w-full px-4 py-3 rounded-lg border border-romantic-pink/30 focus:border-romantic-rose focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">{{ translations[currentLang].selectVerse }}</option>
                <option v-for="verse in verses" 
                        :key="verse" 
                        :value="verse">
                  {{ verse }}
                </option>
                <optgroup v-if="verses.length > 1" label="Verse ranges">
                  <option v-for="i in Math.min(5, verses.length - 1)" 
                          :key="'range-' + i" 
                          :value="`1-${i + 1}`">
                    1-{{ i + 1 }}
                  </option>
                </optgroup>
              </select>
            </div>
          </div>

          <!-- Search Button -->
          <div class="flex justify-center">
            <button @click="searchVerse" 
                    :disabled="loading"
                    class="romantic-button flex items-center justify-center gap-2 px-8">
              <BookOpenIcon class="w-5 h-5" />
              {{ loading ? translations[currentLang].loading : translations[currentLang].search }}
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ error }}
          </div>

          <!-- Verse Display -->
          <div v-if="verseData && !loading" class="mt-8 p-6 bg-romantic-cream/50 rounded-lg">
            <p class="verse-text mb-4">{{ verseData.text }}</p>
            <p class="text-lg text-romantic-rose font-medium">
              {{ verseData.reference }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="text-center text-romantic-rose/70 text-sm">
        <p>Made with <HeartIcon class="w-4 h-4 inline text-romantic-rose" /> for spreading God's word</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { HeartIcon, BookOpenIcon } from '@heroicons/vue/24/solid'
import axios from 'axios'
import dayjs from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import { bibleBooks } from './bibleData'

// Extend dayjs with dayOfYear plugin
dayjs.extend(dayOfYear)

// State
const currentLang = ref('de')
const selectedTranslation = ref('web')
const selectedBookIndex = ref(null)
const selectedChapter = ref(null)
const selectedVerse = ref('')
const loading = ref(false)
const error = ref('')
const verseData = ref(null)
const dailyVerseData = ref(null)
const loadingDaily = ref(false)

// Computed properties
const books = computed(() => bibleBooks[currentLang.value])
const selectedBook = computed(() => selectedBookIndex.value !== null ? books.value[selectedBookIndex.value] : null)
const chapters = computed(() => {
  if (!selectedBook.value) return []
  return Array.from({ length: selectedBook.value.chapters }, (_, i) => i + 1)
})
const verses = computed(() => {
  if (!selectedBook.value || !selectedChapter.value) return []
  const verseCount = selectedBook.value.verses[selectedChapter.value - 1]
  return Array.from({ length: verseCount }, (_, i) => i + 1)
})

// Available translations
const availableTranslations = {
  de: [
    { code: 'web', name: 'World English Bible' },
    { code: 'kjv', name: 'King James Version' },
    { code: 'asv', name: 'American Standard Version' }
  ],
  en: [
    { code: 'kjv', name: 'King James Version' },
    { code: 'web', name: 'World English Bible' },
    { code: 'asv', name: 'American Standard Version' }
  ]
}

// Translations
const translations = {
  de: {
    subtitle: 'Schöne Bibelverse für die Seele',
    dailyVerse: 'Täglicher Ermutigungsvers',
    searchTitle: 'Bibelvers suchen',
    selectTranslation: 'Übersetzung wählen',
    book: 'Buch',
    bookPlaceholder: 'Buch wählen',
    selectBook: 'Bitte wählen Sie ein Buch',
    selectChapter: 'Bitte wählen Sie ein Kapitel',
    selectVerse: 'Verse wählen (optional)',
    chapter: 'Kapitel',
    verse: 'Vers(e)',
    search: 'Suchen',
    loading: 'Lädt...',
    showDaily: 'Tagesvers zeigen',
    searchVerses: 'Verse suchen',
    error: 'Fehler beim Laden des Verses'
  },
  en: {
    subtitle: 'Beautiful Bible verses for the soul',
    dailyVerse: 'Daily Encouragement Verse',
    searchTitle: 'Search Bible Verse',
    selectTranslation: 'Select Translation',
    book: 'Book',
    bookPlaceholder: 'Select a book',
    selectBook: 'Please select a book',
    selectChapter: 'Please select a chapter',
    selectVerse: 'Select verse(s) (optional)',
    chapter: 'Chapter',
    verse: 'Verse(s)',
    search: 'Search',
    loading: 'Loading...',
    showDaily: 'Show Daily Verse',
    searchVerses: 'Search Verses',
    error: 'Error loading verse'
  }
}

// Watch language change to update translation
watch(currentLang, (newLang) => {
  selectedTranslation.value = availableTranslations[newLang][0].code
  // Reset selections when language changes
  selectedBookIndex.value = null
  selectedChapter.value = null
  selectedVerse.value = ''
})

// Reset chapter and verse when book changes
watch(selectedBookIndex, () => {
  selectedChapter.value = null
  selectedVerse.value = ''
})

// Reset verse when chapter changes
watch(selectedChapter, () => {
  selectedVerse.value = ''
})

// Encouraging verses list (curated for daily display)
const encouragingVerses = [
  { book: 'Jeremiah', chapter: 29, verse: 11 },
  { book: 'Isaiah', chapter: 41, verse: 10 },
  { book: 'Philippians', chapter: 4, verse: 13 },
  { book: 'Romans', chapter: 8, verse: 28 },
  { book: 'Psalm', chapter: 23, verse: 1 },
  { book: 'Proverbs', chapter: 3, verse: '5-6' },
  { book: 'Matthew', chapter: 11, verse: '28-30' },
  { book: 'John', chapter: 3, verse: 16 },
  { book: '1 Corinthians', chapter: 13, verse: '4-7' },
  { book: 'Psalm', chapter: 91, verse: '1-2' },
  { book: 'Joshua', chapter: 1, verse: 9 },
  { book: 'Psalm', chapter: 46, verse: 1 },
  { book: '2 Timothy', chapter: 1, verse: 7 },
  { book: 'Isaiah', chapter: 40, verse: 31 },
  { book: 'Deuteronomy', chapter: 31, verse: 6 },
  { book: 'Psalm', chapter: 34, verse: '17-18' },
  { book: 'Matthew', chapter: 6, verse: '33-34' },
  { book: 'Hebrews', chapter: 11, verse: 1 },
  { book: 'Psalm', chapter: 27, verse: 1 },
  { book: '1 Peter', chapter: 5, verse: 7 },
  { book: 'Psalm', chapter: 37, verse: '4-5' },
  { book: 'Isaiah', chapter: 26, verse: 3 },
  { book: 'Romans', chapter: 15, verse: 13 },
  { book: 'Psalm', chapter: 121, verse: '1-2' },
  { book: 'Ephesians', chapter: 3, verse: '20-21' },
  { book: 'Psalm', chapter: 139, verse: '13-14' },
  { book: 'Lamentations', chapter: 3, verse: '22-23' },
  { book: 'Psalm', chapter: 103, verse: '1-5' },
  { book: '2 Corinthians', chapter: 12, verse: 9 },
  { book: 'Psalm', chapter: 16, verse: 11 },
  { book: 'Colossians', chapter: 3, verse: '1-2' },
  { book: 'Psalm', chapter: 118, verse: 24 },
  { book: 'Galatians', chapter: 2, verse: 20 },
  { book: 'Psalm', chapter: 19, verse: 14 },
  { book: 'Philippians', chapter: 1, verse: 6 },
  { book: 'Psalm', chapter: 84, verse: 11 },
  { book: 'Isaiah', chapter: 43, verse: '1-2' },
  { book: 'Psalm', chapter: 62, verse: '1-2' },
  { book: 'John', chapter: 14, verse: 27 },
  { book: 'Psalm', chapter: 100, verse: '4-5' },
  { book: '1 John', chapter: 4, verse: '18-19' },
  { book: 'Psalm', chapter: 145, verse: '18-19' },
  { book: 'Romans', chapter: 12, verse: 12 },
  { book: 'Psalm', chapter: 55, verse: 22 },
  { book: 'James', chapter: 1, verse: 17 },
  { book: 'Psalm', chapter: 40, verse: '1-3' },
  { book: 'Hebrews', chapter: 13, verse: '5-6' },
  { book: 'Psalm', chapter: 125, verse: '1-2' },
  { book: '1 Thessalonians', chapter: 5, verse: '16-18' },
  { book: 'Psalm', chapter: 73, verse: '25-26' },
  { book: 'Nahum', chapter: 1, verse: 7 },
  { book: 'Psalm', chapter: 31, verse: '23-24' },
  { book: 'Ephesians', chapter: 2, verse: '8-9' },
  { book: 'Psalm', chapter: 119, verse: 105 },
  { book: '2 Corinthians', chapter: 4, verse: '16-18' },
  { book: 'Psalm', chapter: 147, verse: 3 },
  { book: 'Philippians', chapter: 4, verse: '6-7' },
  { book: 'Psalm', chapter: 9, verse: '9-10' },
  { book: 'Isaiah', chapter: 54, verse: 17 },
  { book: 'Psalm', chapter: 18, verse: '1-2' },
  { book: 'Romans', chapter: 8, verse: '38-39' },
  { book: 'Psalm', chapter: 32, verse: 7 },
  { book: 'John', chapter: 16, verse: 33 },
  { book: 'Psalm', chapter: 138, verse: 8 },
  { book: '1 Chronicles', chapter: 16, verse: 11 },
  { book: 'Psalm', chapter: 94, verse: '18-19' },
  { book: 'Zephaniah', chapter: 3, verse: 17 },
  { book: 'Psalm', chapter: 5, verse: '11-12' },
  { book: 'Matthew', chapter: 5, verse: 16 },
  { book: 'Psalm', chapter: 42, verse: 11 },
  { book: 'Isaiah', chapter: 58, verse: 11 },
  { book: 'Psalm', chapter: 28, verse: 7 },
  { book: '2 Corinthians', chapter: 5, verse: 17 },
  { book: 'Psalm', chapter: 119, verse: '49-50' },
  { book: 'Micah', chapter: 7, verse: 7 },
  { book: 'Psalm', chapter: 71, verse: '5-6' },
  { book: 'John', chapter: 10, verse: 10 },
  { book: 'Psalm', chapter: 143, verse: 8 },
  { book: 'Proverbs', chapter: 16, verse: 9 },
  { book: 'Psalm', chapter: 33, verse: '20-22' },
  { book: '1 John', chapter: 5, verse: '14-15' },
  { book: 'Psalm', chapter: 86, verse: 5 }
]

// Get daily verse based on date with more variety
const getDailyVerse = () => {
  const date = dayjs()
  const dayOfYear = date.dayOfYear()
  const year = date.year()
  
  // Use a more sophisticated algorithm for better daily variety
  // This ensures each day gets a unique verse and cycles through all verses
  const totalVerses = encouragingVerses.length
  const daysElapsed = Math.floor((date.valueOf() - new Date('2025-01-01').valueOf()) / (1000 * 60 * 60 * 24))
  const index = daysElapsed % totalVerses
  
  return encouragingVerses[index]
}

// Search for a verse
const searchVerse = async () => {
  if (selectedBookIndex.value === null || !selectedChapter.value) {
    error.value = currentLang.value === 'de' 
      ? 'Bitte Buch und Kapitel wählen' 
      : 'Please select book and chapter'
    return
  }

  loading.value = true
  error.value = ''
  verseData.value = null

  try {
    // Always use English book names for the API
    const bookName = selectedBook.value.englishName || selectedBook.value.name
    
    // Replace spaces with + for the API
    const formattedBookName = bookName.replace(/\s+/g, '+')
    const reference = `${formattedBookName}+${selectedChapter.value}${selectedVerse.value ? ':' + selectedVerse.value : ''}`
    
    console.log('Searching for:', reference, 'Translation:', selectedTranslation.value)
    
    const response = await axios.get(`/api/bible/${reference}?translation=${selectedTranslation.value}`)
    
    console.log('API Response:', response.data)
    
    verseData.value = {
      text: response.data.text.trim(),
      reference: response.data.reference
    }
  } catch (err) {
    console.error('Search error:', err)
    error.value = translations[currentLang.value].error
  } finally {
    loading.value = false
  }
}

// Load daily verse
const loadDailyVerse = async () => {
  const dailyRef = getDailyVerse()
  const formattedBook = dailyRef.book.replace(/\s+/g, '+')
  const reference = `${formattedBook}+${dailyRef.chapter}:${dailyRef.verse}`
  
  // Show loading state
  loadingDaily.value = true
  
  try {
    // Load German version (using WEB translation)
    const deResponse = await axios.get(`/api/bible/${reference}?translation=web`)
    // Load English version
    const enResponse = await axios.get(`/api/bible/${reference}?translation=kjv`)
    
    dailyVerseData.value = {
      de: {
        text: deResponse.data.text.trim(),
        reference: deResponse.data.reference
      },
      en: {
        text: enResponse.data.text.trim(),
        reference: enResponse.data.reference
      }
    }
  } catch (err) {
    console.error('Error loading daily verse:', err)
    // Fallback to a default verse if API fails
    dailyVerseData.value = {
      de: {
        text: 'Denn ich weiß, was für Gedanken ich über euch habe, spricht Jehova, Gedanken des Friedens und nicht zum Unglück, um euch Ausgang und Hoffnung zu gewähren.',
        reference: 'Jeremia 29:11'
      },
      en: {
        text: 'For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.',
        reference: 'Jeremiah 29:11'
      }
    }
  } finally {
    loadingDaily.value = false
  }
}

// Load daily verse on mount
onMounted(() => {
  loadDailyVerse()
})
</script>

<style>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
</style>