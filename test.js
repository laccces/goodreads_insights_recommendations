// ============================================
// Unit Tests for GoodReads Library Explorer
// ============================================

const TestRunner = {
    tests: [],
    passed: 0,
    failed: 0,
    
    describe(name, fn) {
        console.log(`\n📦 ${name}`);
        fn();
    },
    
    it(description, fn) {
        try {
            fn();
            this.passed++;
            console.log(`  ✅ ${description}`);
        } catch (error) {
            this.failed++;
            console.log(`  ❌ ${description}`);
            console.log(`     Error: ${error.message}`);
        }
    },
    
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
        }
    },
    
    assertTrue(value, message) {
        if (!value) {
            throw new Error(message || 'Expected true, got false');
        }
    },
    
    assertFalse(value, message) {
        if (value) {
            throw new Error(message || 'Expected false, got true');
        }
    },
    
    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Expected non-null value');
        }
    },
    
    runAll() {
        console.log('🧪 Running Unit Tests...\n');
        console.log('═'.repeat(50));
        
        // Run all test suites
        this.testDataNormalization();
        this.testCalculations();
        this.testScoring();
        
        console.log('\n' + '═'.repeat(50));
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️  Some tests failed');
        }
        
        return {
            passed: this.passed,
            failed: this.failed,
            total: this.passed + this.failed
        };
    },
    
    // Test Suite: Data Normalization
    testDataNormalization() {
        this.describe('Data Normalization', () => {
            
            this.it('should extract year from DD/MM/YYYY date format', () => {
                const year = extractYear('03/01/2025');
                this.assertEqual(year, 2025, 'Should parse year from date');
            });
            
            this.it('should handle malformed dates gracefully', () => {
                const year = extractYear('invalid-date');
                this.assertEqual(year, null, 'Should return null for invalid dates');
            });
            
            this.it('should calculate length category for short books', () => {
                const category = getLengthCategory(250);
                this.assertEqual(category, 'short', 'Books under 300 pages are short');
            });
            
            this.it('should calculate length category for epic books', () => {
                const category = getLengthCategory(850);
                this.assertEqual(category, 'epic', 'Books over 800 pages are epic');
            });
            
            this.it('should calculate era category for classics', () => {
                const era = getEraCategory(1940);
                this.assertEqual(era, 'classic', 'Books before 1950 are classics');
            });
            
            this.it('should calculate era category for modern books', () => {
                const era = getEraCategory(2020);
                this.assertEqual(era, 'modern', 'Books from 2000+ are modern');
            });
            
            this.it('should clean ISBN by removing Excel artifacts', () => {
                const isbn = extractIsbn('="9780425189245"');
                this.assertEqual(isbn, '9780425189245', 'Should remove Excel artifacts');
            });
            
            this.it('should handle missing ISBN gracefully', () => {
                const isbn = extractIsbn(null);
                this.assertEqual(isbn, null, 'Should return null for missing ISBN');
            });
        });
    },
    
    // Test Suite: Calculations
    testCalculations() {
        this.describe('Calculations', () => {
            
            this.it('should calculate average of array', () => {
                const avg = average([10, 20, 30]);
                this.assertEqual(avg, 20, 'Average of [10,20,30] is 20');
            });
            
            this.it('should return 0 for empty array', () => {
                const avg = average([]);
                this.assertEqual(avg, 0, 'Average of empty array is 0');
            });
            
            this.it('should calculate median of odd-length array', () => {
                const med = median([1, 2, 3, 4, 5]);
                this.assertEqual(med, 3, 'Median of [1,2,3,4,5] is 3');
            });
            
            this.it('should calculate median of even-length array', () => {
                const med = median([1, 2, 3, 4]);
                this.assertEqual(med, 2.5, 'Median of [1,2,3,4] is 2.5');
            });
            
            this.it('should find most frequent value', () => {
                const mostCommon = getMostFrequent(['A', 'B', 'A', 'C', 'A']);
                this.assertEqual(mostCommon, 'A', 'Most frequent is A');
            });
            
            this.it('should calculate years from date', () => {
                // Testing with a fixed date: assume current date calculation
                const date = '01/01/2024';
                const parsedDate = parseDateSafe(date);
                this.assertNotNull(parsedDate, 'Should parse valid date');
            });
        });
    },
    
    // Test Suite: Scoring
    testScoring() {
        this.describe('Scoring Logic', () => {
            
            this.it('should apply time filter for quick reads', () => {
                const books = [
                    { pages: 200, title: 'Short' },
                    { pages: 400, title: 'Medium' },
                    { pages: 600, title: 'Long' }
                ];
                const filtered = applyTimeFilter(books, 'quick');
                this.assertEqual(filtered.length, 1, 'Only 1 book under 300 pages');
                this.assertEqual(filtered[0].title, 'Short', 'Correct book filtered');
            });
            
            this.it('should return all books when no filter', () => {
                const books = [
                    { pages: 200, title: 'Short' },
                    { pages: 400, title: 'Medium' }
                ];
                const filtered = applyTimeFilter(books, 'any');
                this.assertEqual(filtered.length, 2, 'All books returned with any filter');
            });
            
            this.it('should calculate local score with base rating', () => {
                const book = { averageRating: 4.5, pages: 400, publicationYear: 2020 };
                const profile = { avgLength: null, avgEra: null };
                const filters = {};
                const score = scoreLocally(book, filters, profile);
                this.assertEqual(score, 4.5, 'Base score equals average rating');
            });
            
            this.it('should calculate top candidates correctly', () => {
                const scored = [
                    { book: { title: 'A' }, score: 5 },
                    { book: { title: 'B' }, score: 3 },
                    { book: { title: 'C' }, score: 4 }
                ];
                const top = selectTopCandidates(scored, 2);
                this.assertEqual(top.length, 2, 'Returns top 2');
                this.assertEqual(top[0].book.title, 'A', 'Highest score first');
            });
            
            this.it('should derive behaviour profile from read books', () => {
                const readBooks = [
                    { pages: 300, publicationYear: 2010, author: 'Author A', dateRead: '01/01/2024' },
                    { pages: 320, publicationYear: 2015, author: 'Author A', dateRead: '01/02/2024' },
                    { pages: 350, publicationYear: 2020, author: 'Author B', dateRead: '01/03/2024' }
                ];
                // Temporarily set books array for testing
                const originalBooks = books;
                books = readBooks;
                const profile = deriveBehaviourProfile();
                this.assertNotNull(profile, 'Profile should be created');
                this.assertTrue(profile.topAuthors.includes('Author A'), 'Author A is top author');
                // Restore original
                books = originalBooks;
            });
        });
    }
};

// ============================================
// Sample Data Validation Tests
// ============================================

const SampleDataValidator = {
    validate() {
        console.log('\n📋 Validating Sample Data...\n');
        
        const results = {
            valid: true,
            errors: []
        };
        
        // Parse sample data
        const rows = SAMPLE_CSV_DATA.split('\n').slice(1); // Skip header
        
        if (rows.length < 10) {
            results.errors.push('Sample data should have at least 10 books');
            results.valid = false;
        }
        
        // Check for read books
        const readCount = rows.filter(row => row.includes('Read')).length;
        if (readCount < 5) {
            results.errors.push(`Expected at least 5 read books, got ${readCount}`);
        }
        
        // Check for unread books
        const unreadCount = rows.filter(row => row.includes('to-read') || row.includes('Currently')).length;
        if (unreadCount < 3) {
            results.errors.push(`Expected at least 3 unread books, got ${unreadCount}`);
        }
        
        // Check date formats
        const datePattern = /\d{2}\/\d{2}\/\d{4}/;
        const hasValidDates = rows.some(row => datePattern.test(row));
        if (!hasValidDates) {
            results.errors.push('Sample data missing valid dates');
        }
        
        // Check for year range
        const hasOldBooks = rows.some(row => {
            const yearMatch = row.match(/,(\d{4}),/);
            return yearMatch && parseInt(yearMatch[1]) < 1990;
        });
        
        const hasNewBooks = rows.some(row => {
            const yearMatch = row.match(/,(\d{4}),/);
            return yearMatch && parseInt(yearMatch[1]) > 2015;
        });
        
        if (!hasOldBooks || !hasNewBooks) {
            results.errors.push('Sample data should span multiple eras');
        }
        
        // Report results
        if (results.valid && results.errors.length === 0) {
            console.log('✅ Sample data is valid');
            console.log(`   - Total books: ${rows.length}`);
            console.log(`   - Read: ${readCount}`);
            console.log(`   - Unread: ${unreadCount}`);
        } else {
            console.log('❌ Sample data issues found:');
            results.errors.forEach(err => console.log(`   - ${err}`));
        }
        
        return results;
    }
};

// ============================================
// Run Tests
// ============================================

// ============================================
// Manual trigger only - no auto-run
// ============================================

function runAllTests() {
    console.log('🚀 GoodReads Library Explorer - Test Suite\n');
    console.log('Running tests... This may take a moment.\n');
    
    // Run all unit tests
    const testResults = TestRunner.runAll();
    
    // Validate sample data
    SampleDataValidator.validate();
    
    console.log('\n' + '═'.repeat(50));
    console.log('\n✨ Testing complete!\n');
    
    return testResults;
}

// Export for use in test.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestRunner, SampleDataValidator, runAllTests };
}