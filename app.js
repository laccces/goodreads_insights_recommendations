// ============================================
// Library Insights - Phase 1: Data Ingestion
// ============================================

// Global state - holds all parsed book data
let books = [];

// ============================================
// Sample Data for Demo
// ============================================

const SAMPLE_CSV_DATA = `Title,Author,Genre,Year Published,Pages,Date Started,Date Finished,Rating,Average Rating,ISBN,Status
Project Hail Mary,Andy Weir,Science Fiction,2021,496,03/01/2025,12/01/2025,5,4.35,9780593135204,Read
Kindred,Octavia E. Butler,Science Fiction,1979,264,15/01/2025,22/01/2025,5,4.25,9780807083697,Read
The Midnight Library,Matt Haig,Fiction,2020,304,25/01/2025,01/02/2025,4,3.85,9780525559474,Read
Educated,Tara Westover,Memoir,2018,352,03/02/2025,12/02/2025,4,4.15,9780399590504,Read
Atomic Habits,James Clear,Self Help,2018,320,15/02/2025,22/02/2025,4,4.35,9780735211292,Read
The Handmaid's Tale,Margaret Atwood,Dystopian,1985,311,01/03/2025,08/03/2025,5,4.15,9780385490818,Read
Becoming,Michelle Obama,Memoir,2018,426,10/03/2025,18/03/2025,4,4.45,9781524763138,Read
Circe,Madeline Miller,Fantasy,2018,393,20/03/2025,30/03/2025,5,4.25,9780316334756,Read
The Pragmatic Programmer,Andrew Hunt,Technology,1999,352,01/04/2025,12/04/2025,4,4.35,9780201616224,Read
Dune,Frank Herbert,Science Fiction,1965,412,05/04/2025,15/04/2025,5,4.25,9780441172719,Read
Deep Work,Cal Newport,Productivity,2016,296,15/04/2025,,0,4.15,9781455586691,Currently Reading
The Vanishing Half,Brit Bennett,Fiction,2020,343,18/04/2025,,0,4.05,9780525536291,Currently Reading
Sapiens,Yuval Noah Harari,History,2011,443,01/05/2024,15/05/2024,4,4.35,9780062316097,Read
The Power,Naomi Alderman,Science Fiction,2016,386,,,0,3.85,9780316547613,Want to Read
The Fifth Season,N.K. Jemisin,Fantasy,2015,512,,,0,4.25,9780316229296,Want to Read
Lean In,Sheryl Sandberg,Business,2013,240,,,0,3.75,9780385349949,Want to Read
Thinking Fast and Slow,Daniel Kahneman,Psychology,2011,499,20/05/2024,10/06/2024,4,4.05,9780374275631,Read
The Martian,Andy Weir,Science Fiction,2014,369,01/06/2024,15/06/2024,5,4.35,9780804139021,Read
Gone Girl,Gillian Flynn,Thriller,2012,432,,,0,3.95,9780307588371,Want to Read
Station Eleven,Emily St. John Mandel,Fiction,2014,333,20/06/2024,05/07/2024,4,3.95,9780385353305,Read`;

// ============================================
// Data Normalisation
// ============================================

/**
 * Normalises a raw CSV row into a clean, predictable book object.
 * Maps various field names and handles missing data gracefully.
 * @param {Object} row - Raw CSV row from PapaParse
 * @returns {Object} Normalised book object
 */
function normaliseBook(row) {
    return {
        // Core book info
        title: cleanString(row.Title || row.title || ''),
        author: cleanString(row.Author || row.author || row.Authors || ''),
        
        // Numeric fields - safely parse with fallbacks
        pages: parseNumber(row['Number of Pages'] || row.pages),
        publicationYear: parseNumber(row['Original Publication Year'] || row.publicationYear || row['Year Published']),
        averageRating: parseFloatOrZero(row['Average Rating'] || row.averageRating),
        userRating: parseFloatOrZero(row['My Rating'] || row.userRating || row.Rating || row['My Rating']),
        
        // Date fields
        dateRead: cleanString(row['Date Read'] || row.dateRead || row['Date Finished'] || null),
        dateAdded: cleanString(row['Date Added'] || row.dateAdded || row['Date Started'] || null),
        
        // Categorisation
        shelves: cleanString(row.Bookshelves || row.shelves || row.Status || ''),
        
        // ISBN - prefer 13, fallback to 10, clean Excel artifacts
        isbn: extractIsbn(row.ISBN13 || row.ISBN || row.isbn13 || row.isbn)
    };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Safely parses a string to integer, returns 0 if invalid.
 * @param {*} value - Value to parse
 * @returns {number} Parsed number or 0
 */
function parseNumber(value) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Safely parses a string to float, returns 0 if invalid.
 * @param {*} value - Value to parse
 * @returns {number} Parsed float or 0
 */
function parseFloatOrZero(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Cleans and trims a string value.
 * @param {*} value - Value to clean
 * @returns {string|null} Cleaned string or null
 */
function cleanString(value) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).trim();
    return cleaned.length > 0 ? cleaned : null;
}

/**
 * Extracts clean ISBN from value, removing Excel formula artifacts.
 * @param {*} value - Raw ISBN value (may contain ="..." format)
 * @returns {string|null} Clean ISBN or null
 */
function extractIsbn(value) {
    if (!value) return null;
    
    let cleaned = String(value).trim();
    
    // Remove Excel formula artifacts: ="9780425189245" or =9780425189245
    if (cleaned.startsWith('="') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(2, -1);
    } else if (cleaned.startsWith('=')) {
        cleaned = cleaned.slice(1);
    }
    
    // Remove any remaining quotes
    cleaned = cleaned.replace(/^["']+|["']+$/g, '');
    
    return cleaned.length > 0 ? cleaned : null;
}

// ============================================
// File Upload Handling
// ============================================

/**
 * Initialises the file upload listener.
 * Called when DOM is ready.
 */
function initUploadHandler() {
    const fileInput = document.getElementById('csv-input');
    const sampleDataBtn = document.getElementById('sample-data-btn');
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        processCSV(file);
    });
    
    // Handle sample data button
    if (sampleDataBtn) {
        sampleDataBtn.addEventListener('click', () => {
            loadSampleData();
        });
    }
}

/**
 * Loads sample data for demo purposes.
 */
function loadSampleData() {
    Papa.parse(SAMPLE_CSV_DATA, {
        header: true,
        skipEmptyLines: true,
        complete: handleParseComplete,
        error: handleParseError
    });
}

/**
 * Reads and parses the CSV file using PapaParse.
 * @param {File} file - The uploaded CSV file
 */
function processCSV(file) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const csvText = event.target.result;
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: handleParseComplete,
            error: handleParseError
        });
    };
    
    reader.onerror = () => {
        console.error('Error reading file');
    };
    
    reader.readAsText(file);
}

/**
 * Handles successful CSV parsing.
 * Normalises data and updates global state.
 * @param {Object} results - PapaParse results object
 */
function handleParseComplete(results) {
    if (results.errors.length > 0) {
        console.warn('CSV parse errors:', results.errors);
    }
    
    // Normalise all rows and store in global state
    books = results.data.map(normaliseBook);
    
    // Log summary to console for verification
    console.log('Data Ingestion Complete');
    console.log('Total books parsed:', books.length);
    console.log('First 3 records:', books.slice(0, 3));
    
    // Initialise analytics layer
    initAnalytics();
}

/**
 * Handles CSV parsing errors.
 * @param {Error} error - Parse error
 */
function handleParseError(error) {
    console.error('CSV parse error:', error);
}

// ============================================
// Phase 2: Analytics Layer
// ============================================

/**
 * Initialises the analytics layer.
 * Derives read/unread books, calculates metrics, and renders results.
 */
function initAnalytics() {
    // Derive read and unread books based on dateRead field
    const readBooks = books.filter(book => book.dateRead !== null);
    const unreadBooks = books.filter(book => book.dateRead === null);
    
    // Filter to only "want to read" books for backlog intelligence
    const wantToReadBooks = unreadBooks.filter(book => {
        if (!book.shelves) return false;
        const shelves = book.shelves.toLowerCase();
        return shelves.includes('to-read') || shelves.includes('want-to-read');
    });
    
    // Calculate all metrics
    const metrics = calculateMetrics(readBooks, unreadBooks, wantToReadBooks);
    
    // Render analytics to the DOM
    renderAnalytics(metrics);
    
    // Initialise decision engine
    initDecisionEngine(wantToReadBooks);
}

/**
 * Calculates summary metrics from read and unread book arrays.
 * @param {Array} readBooks - Books that have been read
 * @param {Array} unreadBooks - Books not yet read
 * @param {Array} wantToReadBooks - Books marked as "want to read"
 * @returns {Object} Calculated metrics
 */
function calculateMetrics(readBooks, unreadBooks, wantToReadBooks) {
    return {
        totalBooks: books.length,
        booksRead: readBooks.length,
        booksUnread: unreadBooks.length,
        averagePages: average(readBooks.map(b => b.pages).filter(p => p > 0)),
        averageUserRating: average(readBooks.map(b => b.userRating).filter(r => r > 0)),
        medianPublicationYear: median(readBooks.map(b => b.publicationYear).filter(y => y > 0)),
        topAuthors: getTopAuthors(readBooks.map(b => b.author).filter(a => a !== null), 3),
        booksPerYear: groupByYear(readBooks),
        tasteProfile: calculateTasteProfile(readBooks),
        backlogInsights: calculateBacklogInsights(wantToReadBooks)
    };
}

/**
 * Renders analytics metrics to the analytics section.
 * @param {Object} metrics - Metrics object from calculateMetrics
 */
function renderAnalytics(metrics) {
    const analyticsSection = document.getElementById('analytics-section');
    const analyticsContent = document.getElementById('analytics-content');
    
    // Show the analytics section
    analyticsSection.classList.remove('hidden');
    
    // Build HTML content
    let html = `
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Library Overview</h3>
                <p class="metric-description">Your complete book collection</p>
                <p><strong>Total Books:</strong> ${metrics.totalBooks}</p>
                <p><strong>Books Read:</strong> ${metrics.booksRead}</p>
                <p><strong>Books Unread:</strong> ${metrics.booksUnread}</p>
            </div>
            
            <div class="metric-card">
                <h3>Reading Stats</h3>
                <p class="metric-description">Analysis of books you've read</p>
                <p><strong>Average No. of Pages:</strong> ${formatNumber(metrics.averagePages)}</p>
                <p><strong>Your Average Rating:</strong> ${formatNumber(metrics.averageUserRating, 2)}</p>
                <p><strong>Median Pub Year:</strong> ${formatNumber(metrics.medianPublicationYear, 0)}</p>
            </div>
            
            <div class="metric-card">
                <h3>Top Authors</h3>
                <p class="metric-description">Most-read authors from your finished books</p>
                ${metrics.topAuthors.length === 0 ? '<p>N/A</p>' : 
                  '<ul>' + metrics.topAuthors.map(a => 
                    `<li>${a.author}: ${a.count} book${a.count !== 1 ? 's' : ''} read</li>`
                  ).join('') + '</ul>'}
            </div>
            
            <div class="metric-card">
                <h3>Reading by Year</h3>
                <p class="metric-description">Your book totals for the last five years</p>
    `;
    
    // Add books per year (last 5 years only)
    const currentYear = new Date().getFullYear();
    const yearEntries = Object.entries(metrics.booksPerYear)
        .filter(([year]) => year >= currentYear - 4)
        .sort((a, b) => b[0] - a[0]);
    
    if (yearEntries.length === 0) {
        html += '<p>No reading data available</p>';
    } else {
        html += '<ul>';
        yearEntries.forEach(([year, count]) => {
            const isCurrentYear = parseInt(year) === currentYear;
            const suffix = isCurrentYear ? ' so far' : '';
            html += `<li>${year}${suffix}: ${count} book${count !== 1 ? 's' : ''}</li>`;
        });
        html += '</ul>';
    }
    
    html += `
            </div>
        </div>
        
        <div class="taste-profile">
            <h3>Taste Profile</h3>
            <p class="section-description">Your reading patterns and preferences based on books you've finished</p>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Book Length Preference</h4>
                    <p class="metric-description">Page count distribution of finished books</p>
                    ${metrics.booksRead === 0 ? '<p>No read books</p>' : `
                        <ul>
                            <li>Short (&lt;300p): ${metrics.tasteProfile.lengthDistribution.short.count} (${metrics.tasteProfile.lengthDistribution.short.percentage}%)</li>
                            <li>Medium (300-500p): ${metrics.tasteProfile.lengthDistribution.medium.count} (${metrics.tasteProfile.lengthDistribution.medium.percentage}%)</li>
                            <li>Long (500-800p): ${metrics.tasteProfile.lengthDistribution.long.count} (${metrics.tasteProfile.lengthDistribution.long.percentage}%)</li>
                            <li>Epic (800p+): ${metrics.tasteProfile.lengthDistribution.epic.count} (${metrics.tasteProfile.lengthDistribution.epic.percentage}%)</li>
                        </ul>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Era Preference</h4>
                    <p class="metric-description">When your finished books were published</p>
                    ${metrics.booksRead === 0 ? '<p>No read books</p>' : `
                        <ul>
                            <li>Classic (pre-1950): ${metrics.tasteProfile.eraDistribution.classic.count} (${metrics.tasteProfile.eraDistribution.classic.percentage}%)</li>
                            <li>Late 20th C. (1950-1999): ${metrics.tasteProfile.eraDistribution.late20th.count} (${metrics.tasteProfile.eraDistribution.late20th.percentage}%)</li>
                            <li>Modern (2000+): ${metrics.tasteProfile.eraDistribution.modern.count} (${metrics.tasteProfile.eraDistribution.modern.percentage}%)</li>
                        </ul>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Rating Behaviour</h4>
                    <p class="metric-description">How you rate finished books</p>
                    ${metrics.booksRead === 0 ? '<p>No read books</p>' : `
                        <ul>
                            <li>Rated 4+: ${metrics.tasteProfile.ratingBehaviour.highRatedPct}%</li>
                            <li>Rated 2 or below: ${metrics.tasteProfile.ratingBehaviour.lowRatedPct}%</li>
                            <li>Most common rating: ${metrics.tasteProfile.ratingBehaviour.mostCommonRating}</li>
                        </ul>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Author Diversity</h4>
                    <p class="metric-description">Ratio of unique authors to total books read</p>
                    ${metrics.booksRead === 0 ? '<p>No read books</p>' : `
                        <p>Score: ${metrics.tasteProfile.authorDiversity} (unique authors / total)</p>
                    `}
                </div>
                
            </div>
        </div>
        
        <div class="backlog-intelligence">
            <h3>Backlog Intelligence</h3>
            <p class="section-description">Analysis of your "Want to Read" list</p>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Total Want to Read</h4>
                    <p>${metrics.backlogInsights.totalUnread} books waiting</p>
                </div>
                
                <div class="metric-card">
                    <h4>Oldest on List</h4>
                    ${!metrics.backlogInsights.oldestUnread ? '<p>N/A</p>' : `
                        <p><strong>${metrics.backlogInsights.oldestUnread.title}</strong></p>
                        <p>by ${metrics.backlogInsights.oldestUnread.author}</p>
                        <p>Added: ${metrics.backlogInsights.oldestUnread.dateAdded}</p>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Average List Age</h4>
                    ${metrics.backlogInsights.averageAge === null ? '<p>N/A</p>' : `
                        <p>${metrics.backlogInsights.averageAge} years</p>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Longest Book</h4>
                    ${!metrics.backlogInsights.longestUnread ? '<p>N/A</p>' : `
                        <p><strong>${metrics.backlogInsights.longestUnread.title}</strong></p>
                        <p>by ${metrics.backlogInsights.longestUnread.author}</p>
                        <p>${metrics.backlogInsights.longestUnread.pages} pages</p>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Shortest Book</h4>
                    ${!metrics.backlogInsights.shortestUnread ? '<p>N/A</p>' : `
                        <p><strong>${metrics.backlogInsights.shortestUnread.title}</strong></p>
                        <p>by ${metrics.backlogInsights.shortestUnread.author}</p>
                        <p>${metrics.backlogInsights.shortestUnread.pages} pages</p>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Highest Rated</h4>
                    ${!metrics.backlogInsights.highestRatedUnread ? '<p>N/A</p>' : `
                        <p><strong>${metrics.backlogInsights.highestRatedUnread.title}</strong></p>
                        <p>by ${metrics.backlogInsights.highestRatedUnread.author}</p>
                        <p>Average rating: ${metrics.backlogInsights.highestRatedUnread.averageRating}</p>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Era Distribution</h4>
                    ${metrics.backlogInsights.totalUnread === 0 ? '<p>No books on list</p>' : `
                        <ul>
                            <li>Classic (pre-1950): ${metrics.backlogInsights.eraDistribution.classic}</li>
                            <li>Late 20th C. (1950-1999): ${metrics.backlogInsights.eraDistribution.late20th}</li>
                            <li>Modern (2000+): ${metrics.backlogInsights.eraDistribution.modern}</li>
                        </ul>
                    `}
                </div>
                
                <div class="metric-card">
                    <h4>Length Distribution</h4>
                    ${metrics.backlogInsights.totalUnread === 0 ? '<p>No books on list</p>' : `
                        <ul>
                            <li>Short (&lt;300p): ${metrics.backlogInsights.lengthDistribution.short}</li>
                            <li>Medium (300-500p): ${metrics.backlogInsights.lengthDistribution.medium}</li>
                            <li>Long (500-800p): ${metrics.backlogInsights.lengthDistribution.long}</li>
                            <li>Epic (800p+): ${metrics.backlogInsights.lengthDistribution.epic}</li>
                        </ul>
                    `}
                </div>
            </div>
        </div>
    `;
    
    analyticsContent.innerHTML = html;
}

/**
 * Calculates the average of an array of numbers.
 * Returns 0 for empty arrays.
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Average value or 0
 */
function average(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
}

/**
 * Calculates the median of an array of numbers.
 * Returns 0 for empty arrays.
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Median value or 0
 */
function median(arr) {
    if (!arr || arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
        return sorted[mid];
    }
}

/**
 * Finds the most frequently occurring value in an array.
 * Returns null for empty arrays.
 * @param {Array} arr - Array of values
 * @returns {string|null} Most frequent value or null
 */
function getMostFrequent(arr) {
    if (!arr || arr.length === 0) return null;
    
    const counts = {};
    let maxCount = 0;
    let maxValue = null;
    
    arr.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
        if (counts[value] > maxCount) {
            maxCount = counts[value];
            maxValue = value;
        }
    });
    
    return maxValue;
}

/**
 * Gets the top N most frequent authors with their counts.
 * @param {Array} arr - Array of author names
 * @param {number} n - Number of top authors to return
 * @returns {Array<{author: string, count: number}>} Top authors with counts
 */
function getTopAuthors(arr, n = 3) {
    if (!arr || arr.length === 0) return [];
    
    const counts = {};
    arr.forEach(author => {
        counts[author] = (counts[author] || 0) + 1;
    });
    
    return Object.entries(counts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

/**
 * Groups read books by the year they were read.
 * Extracts year from dateRead field.
 * @param {Array} readBooks - Books with dateRead values
 * @returns {Object} Map of year -> count
 */
function groupByYear(readBooks) {
    const yearCount = {};
    
    readBooks.forEach(book => {
        if (!book.dateRead) return;
        
        // Extract year from dateRead (handles various formats)
        const year = extractYear(book.dateRead);
        if (year) {
            yearCount[year] = (yearCount[year] || 0) + 1;
        }
    });
    
    return yearCount;
}

/**
 * Extracts a 4-digit year from a date string.
 * Handles formats like "2023/05/15", "2023-05-15", "May 15, 2023", etc.
 * @param {string} dateStr - Date string to parse
 * @returns {number|null} Year as number or null
 */
function extractYear(dateStr) {
    if (!dateStr) return null;
    
    // Match 4-digit year starting with 19 or 20
    const yearMatch = String(dateStr).match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        return parseInt(yearMatch[0], 10);
    }
    
    return null;
}

/**
 * Formats a number for display with optional decimal places.
 * Returns 'N/A' for 0 or invalid values.
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default 1)
 * @returns {string} Formatted number or 'N/A'
 */
function formatNumber(value, decimals = 1) {
    if (value === 0 || value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }
    return value.toFixed(decimals);
}

// ============================================
// Phase 2 Extension: Taste Profiling
// ============================================

/**
 * Calculates taste profiling metrics from read books.
 * @param {Array} readBooks - Books that have been read
 * @returns {Object} Taste profile metrics
 */
function calculateTasteProfile(readBooks) {
    if (!readBooks || readBooks.length === 0) {
        return {
            lengthDistribution: {},
            eraDistribution: {},
            ratingBehaviour: {},
            authorDiversity: 0
        };
    }
    
    return {
        lengthDistribution: calculateLengthDistribution(readBooks),
        eraDistribution: calculateEraDistribution(readBooks),
        ratingBehaviour: calculateRatingBehaviour(readBooks),
        authorDiversity: calculateAuthorDiversity(readBooks)
    };
}

/**
 * Calculates book length distribution across categories.
 * @param {Array} readBooks - Read books with page counts
 * @returns {Object} Length distribution with counts and percentages
 */
function calculateLengthDistribution(readBooks) {
    const total = readBooks.length;
    const buckets = { short: 0, medium: 0, long: 0, epic: 0 };
    
    readBooks.forEach(book => {
        if (book.pages <= 0) return;
        if (book.pages < 300) buckets.short++;
        else if (book.pages <= 500) buckets.medium++;
        else if (book.pages <= 800) buckets.long++;
        else buckets.epic++;
    });
    
    const validBooks = buckets.short + buckets.medium + buckets.long + buckets.epic;
    
    return {
        short: { count: buckets.short, percentage: validBooks > 0 ? ((buckets.short / validBooks) * 100).toFixed(1) : 0 },
        medium: { count: buckets.medium, percentage: validBooks > 0 ? ((buckets.medium / validBooks) * 100).toFixed(1) : 0 },
        long: { count: buckets.long, percentage: validBooks > 0 ? ((buckets.long / validBooks) * 100).toFixed(1) : 0 },
        epic: { count: buckets.epic, percentage: validBooks > 0 ? ((buckets.epic / validBooks) * 100).toFixed(1) : 0 }
    };
}

/**
 * Calculates era distribution by publication year.
 * @param {Array} readBooks - Read books with publication years
 * @returns {Object} Era distribution with counts and percentages
 */
function calculateEraDistribution(readBooks) {
    const buckets = { classic: 0, late20th: 0, modern: 0 };
    
    readBooks.forEach(book => {
        if (!book.publicationYear || book.publicationYear <= 0) return;
        if (book.publicationYear < 1950) buckets.classic++;
        else if (book.publicationYear <= 1999) buckets.late20th++;
        else buckets.modern++;
    });
    
    const validBooks = buckets.classic + buckets.late20th + buckets.modern;
    
    return {
        classic: { count: buckets.classic, percentage: validBooks > 0 ? ((buckets.classic / validBooks) * 100).toFixed(1) : 0 },
        late20th: { count: buckets.late20th, percentage: validBooks > 0 ? ((buckets.late20th / validBooks) * 100).toFixed(1) : 0 },
        modern: { count: buckets.modern, percentage: validBooks > 0 ? ((buckets.modern / validBooks) * 100).toFixed(1) : 0 }
    };
}

/**
 * Calculates rating behaviour insights.
 * @param {Array} readBooks - Read books with user ratings
 * @returns {Object} Rating behaviour metrics
 */
function calculateRatingBehaviour(readBooks) {
    const ratedBooks = readBooks.filter(b => b.userRating > 0);
    if (ratedBooks.length === 0) {
        return { highRatedPct: 0, lowRatedPct: 0, mostCommonRating: 'N/A' };
    }
    
    const highRated = ratedBooks.filter(b => b.userRating >= 4).length;
    const lowRated = ratedBooks.filter(b => b.userRating <= 2).length;
    
    const ratingCounts = {};
    ratedBooks.forEach(b => {
        ratingCounts[b.userRating] = (ratingCounts[b.userRating] || 0) + 1;
    });
    
    const mostCommonRating = Object.entries(ratingCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    return {
        highRatedPct: ((highRated / ratedBooks.length) * 100).toFixed(1),
        lowRatedPct: ((lowRated / ratedBooks.length) * 100).toFixed(1),
        mostCommonRating: mostCommonRating
    };
}

/**
 * Calculates author diversity score.
 * @param {Array} readBooks - Read books with authors
 * @returns {number} Diversity score (unique authors / total books)
 */
function calculateAuthorDiversity(readBooks) {
    const authors = readBooks.map(b => b.author).filter(a => a !== null);
    const uniqueAuthors = new Set(authors).size;
    return authors.length > 0 ? (uniqueAuthors / authors.length).toFixed(2) : 0;
}

// ============================================
// Phase 4: Backlog Intelligence
// ============================================

/**
 * Calculates backlog insights from unread books.
 * @param {Array} unreadBooks - Books not yet read
 * @returns {Object} Backlog intelligence metrics
 */
function calculateBacklogInsights(unreadBooks) {
    if (!unreadBooks || unreadBooks.length === 0) {
        return {
            totalUnread: 0,
            oldestUnread: null,
            averageAge: null,
            longestUnread: null,
            shortestUnread: null,
            highestRatedUnread: null,
            eraDistribution: {},
            lengthDistribution: {}
        };
    }
    
    return {
        totalUnread: unreadBooks.length,
        oldestUnread: findOldestUnread(unreadBooks),
        averageAge: calculateAverageBacklogAge(unreadBooks),
        longestUnread: findLongestUnread(unreadBooks),
        shortestUnread: findShortestUnread(unreadBooks),
        highestRatedUnread: findHighestRatedUnread(unreadBooks),
        eraDistribution: calculateBacklogEraDistribution(unreadBooks),
        lengthDistribution: calculateBacklogLengthDistribution(unreadBooks)
    };
}

/**
 * Parses a date string safely, handling various formats.
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} Parsed date or null
 */
function parseDateSafe(dateStr) {
    if (!dateStr) return null;
    
    // Handle YYYY/MM/DD format from Goodreads
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    
    // Handle standard Date parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Finds the oldest unread book by dateAdded.
 * @param {Array} unreadBooks - Unread books
 * @returns {Object|null} Oldest book or null
 */
function findOldestUnread(unreadBooks) {
    const booksWithDates = unreadBooks
        .filter(b => b.dateAdded)
        .map(b => ({ ...b, parsedDate: parseDateSafe(b.dateAdded) }))
        .filter(b => b.parsedDate !== null);
    
    if (booksWithDates.length === 0) {
        return null;
    }
    
    const sorted = booksWithDates.sort((a, b) => a.parsedDate - b.parsedDate);
    
    const oldest = sorted[0];
    
    return {
        title: oldest.title || 'Unknown',
        author: oldest.author || 'Unknown',
        dateAdded: oldest.dateAdded
    };
}

/**
 * Calculates average age of backlog in years.
 * @param {Array} unreadBooks - Unread books
 * @returns {number|null} Average age or null
 */
function calculateAverageBacklogAge(unreadBooks) {
    const now = new Date();
    const validBooks = unreadBooks
        .map(b => ({ ...b, parsedDate: parseDateSafe(b.dateAdded) }))
        .filter(b => b.parsedDate !== null);
    
    if (validBooks.length === 0) return null;
    
    const totalYears = validBooks.reduce((sum, book) => {
        const years = (now - book.parsedDate) / (1000 * 60 * 60 * 24 * 365.25);
        return sum + years;
    }, 0);
    
    return (totalYears / validBooks.length).toFixed(1);
}

/**
 * Finds the longest unread book by page count.
 * @param {Array} unreadBooks - Unread books
 * @returns {Object|null} Longest book or null
 */
function findLongestUnread(unreadBooks) {
    const booksWithPages = unreadBooks.filter(b => b.pages > 0);
    if (booksWithPages.length === 0) return null;
    
    const sorted = booksWithPages.sort((a, b) => b.pages - a.pages);
    const longest = sorted[0];
    
    return {
        title: longest.title || 'Unknown',
        author: longest.author || 'Unknown',
        pages: longest.pages
    };
}

/**
 * Finds the shortest unread book by page count.
 * @param {Array} unreadBooks - Unread books
 * @returns {Object|null} Shortest book or null
 */
function findShortestUnread(unreadBooks) {
    const booksWithPages = unreadBooks.filter(b => b.pages > 0);
    if (booksWithPages.length === 0) return null;
    
    const sorted = booksWithPages.sort((a, b) => a.pages - b.pages);
    const shortest = sorted[0];
    
    return {
        title: shortest.title || 'Unknown',
        author: shortest.author || 'Unknown',
        pages: shortest.pages
    };
}

/**
 * Finds the highest rated unread book.
 * @param {Array} unreadBooks - Unread books
 * @returns {Object|null} Highest rated book or null
 */
function findHighestRatedUnread(unreadBooks) {
    const booksWithRatings = unreadBooks.filter(b => b.averageRating > 0);
    if (booksWithRatings.length === 0) return null;
    
    const sorted = booksWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    const highest = sorted[0];
    
    return {
        title: highest.title || 'Unknown',
        author: highest.author || 'Unknown',
        averageRating: highest.averageRating.toFixed(2)
    };
}

/**
 * Calculates era distribution for unread books.
 * @param {Array} unreadBooks - Unread books
 * @returns {Object} Era distribution counts
 */
function calculateBacklogEraDistribution(unreadBooks) {
    const buckets = { classic: 0, late20th: 0, modern: 0 };
    
    unreadBooks.forEach(book => {
        if (!book.publicationYear || book.publicationYear <= 0) return;
        if (book.publicationYear < 1950) buckets.classic++;
        else if (book.publicationYear <= 1999) buckets.late20th++;
        else buckets.modern++;
    });
    
    return buckets;
}

/**
 * Calculates length distribution for unread books.
 * @param {Array} unreadBooks - Unread books
 * @returns {Object} Length distribution counts
 */
function calculateBacklogLengthDistribution(unreadBooks) {
    const buckets = { short: 0, medium: 0, long: 0, epic: 0 };
    
    unreadBooks.forEach(book => {
        if (book.pages <= 0) return;
        if (book.pages < 300) buckets.short++;
        else if (book.pages <= 500) buckets.medium++;
        else if (book.pages <= 800) buckets.long++;
        else buckets.epic++;
    });
    
    return buckets;
}

// ============================================

// ============================================
// Phase 5: Behavioural Decision Funnel
// ============================================

// Global state for decision flow
let decisionState = {
    currentStep: 1,
    selections: {
        timeInvestment: '',
        behaviourPreference: '',
        backlogPreference: '',
        riskPreference: ''
    },
    candidates: [],
    allBooks: [],
    behaviourProfile: null
};

/**
 * Initialises the behavioural decision funnel.
 * @param {Array} wantToReadBooks - Books marked as "want to read"
 */
function initDecisionEngine(wantToReadBooks) {
    const decisionSection = document.getElementById('decision-engine-section');
    
    // Show the decision engine section
    decisionSection.classList.remove('hidden');
    
    // Store books and derive behaviour profile
    decisionState.allBooks = wantToReadBooks;
    decisionState.candidates = [...wantToReadBooks];
    decisionState.behaviourProfile = deriveBehaviourProfile();
    
    // Reset state
    decisionState.currentStep = 1;
    decisionState.selections = {
        timeInvestment: '',
        behaviourPreference: '',
        backlogPreference: '',
        riskPreference: ''
    };
    
    // Setup step buttons
    setupStepButtons();
    
    // Setup back buttons
    setupBackButtons();
    
    // Setup start over button
    const startOverBtn = document.getElementById('start-over-btn');
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            resetDecisionFlow();
        });
    }
    
    // Show step 1
    showStep(1);
    updateCandidateCount();
}

/**
 * Sets up step button event listeners.
 */
function setupStepButtons() {
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const step = e.target.dataset.step;
            const value = e.target.dataset.value;
            
            // Store selection
            decisionState.selections[step] = value;
            
            // Handle based on current step
            if (decisionState.currentStep === 1) {
                // Apply time filter
                const filtered = applyTimeFilter(decisionState.candidates, value);
                if (filtered.length === 0) {
                    showNoCandidatesMessage();
                    return;
                }
                decisionState.candidates = filtered;
                advanceStep(2);
            } else if (decisionState.currentStep === 2) {
                advanceStep(3);
            } else if (decisionState.currentStep === 3) {
                advanceStep(4);
            } else if (decisionState.currentStep === 4) {
                // Final step - run recommendation
                runRecommendation();
            }
        });
    });
}

/**
 * Sets up back button event listeners.
 */
function setupBackButtons() {
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetStep = parseInt(e.target.dataset.step);
            
            // Clear filters from steps we're going back past
            if (targetStep < decisionState.currentStep) {
                if (decisionState.currentStep > 3) {
                    decisionState.selections.riskPreference = '';
                }
                if (decisionState.currentStep > 2) {
                    decisionState.selections.backlogPreference = '';
                }
                if (decisionState.currentStep > 1) {
                    decisionState.selections.behaviourPreference = '';
                }
            }
            
            // If going back to step 1, reset candidates
            if (targetStep === 1) {
                decisionState.candidates = [...decisionState.allBooks];
                decisionState.selections.timeInvestment = '';
            }
            
            // Remove summary displays
            document.querySelectorAll('.selections-summary').forEach(el => el.remove());
            
            advanceStep(targetStep);
        });
    });
}

/**
 * Applies time investment filter.
 * @param {Array} books - Books to filter
 * @param {string} selection - User selection
 * @returns {Array} Filtered books
 */
function applyTimeFilter(books, selection) {
    if (!selection || selection === 'any') {
        return books;
    }
    
    return books.filter(book => {
        if (book.pages <= 0) return selection === 'any';
        
        if (selection === 'quick') return book.pages < 300;
        if (selection === 'moderate') return book.pages >= 300 && book.pages <= 500;
        if (selection === 'long') return book.pages > 500;
        return true;
    });
}

/**
 * Derives user's reading behaviour profile from read books.
 * @returns {Object} Behaviour profile
 */
function deriveBehaviourProfile() {
    const readBooks = books.filter(b => b.dateRead !== null);
    
    if (readBooks.length === 0) {
        return { dominantLength: null, dominantEra: null, topAuthors: [] };
    }
    
    // Find dominant length bucket
    const lengthCounts = { quick: 0, moderate: 0, long: 0 };
    readBooks.forEach(book => {
        if (book.pages > 0) {
            if (book.pages < 300) lengthCounts.quick++;
            else if (book.pages <= 500) lengthCounts.moderate++;
            else lengthCounts.long++;
        }
    });
    const dominantLength = Object.entries(lengthCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    // Find dominant era bucket
    const eraCounts = { classic: 0, late20th: 0, modern: 0 };
    readBooks.forEach(book => {
        if (book.publicationYear > 0) {
            if (book.publicationYear < 1950) eraCounts.classic++;
            else if (book.publicationYear <= 1999) eraCounts.late20th++;
            else eraCounts.modern++;
        }
    });
    const dominantEra = Object.entries(eraCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    // Find top authors
    const authorCounts = {};
    readBooks.forEach(book => {
        if (book.author) {
            authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
        }
    });
    const topAuthors = Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([author]) => author);
    
    return { dominantLength, dominantEra, topAuthors, avgRating: average(readBooks.map(b => b.averageRating).filter(r => r > 0)) };
}

/**
 * Advances to specified step.
 * @param {number} stepNumber - Step to show
 */
function advanceStep(stepNumber) {
    // Hide current step
    const currentStepEl = document.getElementById(`step-${decisionState.currentStep}`);
    if (currentStepEl) {
        currentStepEl.classList.add('hidden');
    }
    
    // Show new step
    decisionState.currentStep = stepNumber;
    showStep(stepNumber);
    updateCandidateCount();
}

/**
 * Shows specified step.
 * @param {number} stepNumber - Step to show
 */
function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.decision-step').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show target step
    const stepEl = document.getElementById(`step-${stepNumber}`);
    if (stepEl) {
        stepEl.classList.remove('hidden');
        
        // Add selected preferences summary for steps 2-4, placed after options
        if (stepNumber >= 2 && stepNumber <= 4) {
            const existingSummary = stepEl.querySelector('.selections-summary');
            if (existingSummary) {
                existingSummary.remove();
            }
            
            const summary = document.createElement('div');
            summary.className = 'selections-summary';
            summary.style.cssText = 'background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.75rem; border-radius: 4px; margin-top: 1rem; font-size: 0.9rem;';
            
            let summaryText = '<strong>Your preferences so far:</strong><br>';
            if (decisionState.selections.timeInvestment) {
                const timeLabels = { quick: 'Quick read', moderate: 'Moderate', long: 'Long immersion', any: 'Any length' };
                summaryText += `• Time: ${timeLabels[decisionState.selections.timeInvestment] || decisionState.selections.timeInvestment}<br>`;
            }
            if (decisionState.selections.behaviourPreference && stepNumber > 2) {
                const behLabels = { familiar: 'Stick to what I love', different: 'Try something different', any: 'No preference' };
                summaryText += `• Style: ${behLabels[decisionState.selections.behaviourPreference] || decisionState.selections.behaviourPreference}<br>`;
            }
            if (decisionState.selections.backlogPreference && stepNumber > 3) {
                const backLabels = { old: 'Clear something old', new: 'Read something new', any: 'No preference' };
                summaryText += `• Backlog: ${backLabels[decisionState.selections.backlogPreference] || decisionState.selections.backlogPreference}<br>`;
            }
            
            summary.innerHTML = summaryText;
            
            // Insert after the options div
            const optionsDiv = stepEl.querySelector('.step-options');
            if (optionsDiv) {
                optionsDiv.after(summary);
            }
        }
    }
}

/**
 * Updates candidate count display.
 */
function updateCandidateCount() {
    // Only show count for step 1 (actual filtering)
    if (decisionState.currentStep !== 1) {
        return;
    }
    
    const count = decisionState.candidates.length;
    const stepEl = document.getElementById(`step-${decisionState.currentStep}`);
    if (stepEl) {
        const countEl = stepEl.querySelector('.candidate-count');
        if (countEl) {
            countEl.textContent = `${count} book${count !== 1 ? 's' : ''} available`;
        }
    }
}

/**
 * Shows message when no candidates remain.
 */
function showNoCandidatesMessage() {
    const stepEl = document.getElementById(`step-${decisionState.currentStep}`);
    const countEl = stepEl.querySelector('.candidate-count');
    if (countEl) {
        countEl.innerHTML = `No books match. <button onclick="relaxConstraint()" class="step-btn" style="margin-top: 0.5rem;">Relax Previous Choice</button>`;
    }
}

/**
 * Relaxes the previous constraint.
 */
function relaxConstraint() {
    // Reset candidates to all books
    decisionState.candidates = [...decisionState.allBooks];
    
    // Clear previous selection
    if (decisionState.currentStep === 2) {
        decisionState.selections.timeInvestment = '';
    }
    
    updateCandidateCount();
}

/**
 * Runs final recommendation scoring.
 */
function runRecommendation() {
    const resultDiv = document.getElementById('recommendation-result');
    
    // Hide step 4, show result
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('step-result').classList.remove('hidden');
    
    // Check candidates
    if (decisionState.candidates.length === 0) {
        resultDiv.innerHTML = '<p class="no-match">No books match your criteria.</p>';
        return;
    }
    
    // Score all candidates
    const scored = decisionState.candidates.map(book => ({
        book: book,
        score: calculateFinalScore(book)
    }));
    
    // Sort and select winner
    scored.sort((a, b) => b.score - a.score);
    
    // Mild randomness for tie-breaking (if within 0.5 points)
    let winner = scored[0];
    if (scored.length > 1 && scored[1].score >= winner.score - 0.5) {
        const candidates = scored.filter(s => s.score >= winner.score - 0.5);
        winner = candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    renderRecommendation({
        book: winner.book,
        score: winner.score,
        totalCandidates: scored.length
    });
}

/**
 * Calculates final score for a book.
 * @param {Object} book - Book to score
 * @returns {number} Score
 */
function calculateFinalScore(book) {
    let score = book.averageRating || 0;
    const profile = decisionState.behaviourProfile;
    
    // Step 2: Behaviour alignment
    if (profile && decisionState.selections.behaviourPreference) {
        score += applyBehaviourScoring(book, profile, decisionState.selections.behaviourPreference);
    }
    
    // Step 3: Backlog age
    if (decisionState.selections.backlogPreference) {
        score += applyBacklogScoring(book, decisionState.selections.backlogPreference);
    }
    
    // Step 4: Risk preference
    if (decisionState.selections.riskPreference) {
        score += applyRiskScoring(book, decisionState.selections.riskPreference, profile);
    }
    
    return score;
}

/**
 * Applies behaviour alignment scoring.
 * @param {Object} book - Book to score
 * @param {Object} profile - User behaviour profile
 * @param {string} preference - User preference
 * @returns {number} Bonus score
 */
function applyBehaviourScoring(book, profile, preference) {
    if (!profile.dominantLength && !profile.dominantEra) return 0;
    
    let bonus = 0;
    
    if (preference === 'familiar') {
        // Bonus for matching dominant patterns
        if (profile.dominantLength && book.pages > 0) {
            const bookLength = book.pages < 300 ? 'quick' : book.pages <= 500 ? 'moderate' : 'long';
            if (bookLength === profile.dominantLength) bonus += 1.5;
        }
        if (profile.dominantEra && book.publicationYear > 0) {
            const bookEra = book.publicationYear < 1950 ? 'classic' : book.publicationYear <= 1999 ? 'late20th' : 'modern';
            if (bookEra === profile.dominantEra) bonus += 1.5;
        }
        if (profile.topAuthors.includes(book.author)) {
            bonus += 0.5;
        }
    } else if (preference === 'different') {
        // Bonus for NOT matching dominant patterns
        if (profile.dominantLength && book.pages > 0) {
            const bookLength = book.pages < 300 ? 'quick' : book.pages <= 500 ? 'moderate' : 'long';
            if (bookLength !== profile.dominantLength) bonus += 1;
        }
        if (profile.dominantEra && book.publicationYear > 0) {
            const bookEra = book.publicationYear < 1950 ? 'classic' : book.publicationYear <= 1999 ? 'late20th' : 'modern';
            if (bookEra !== profile.dominantEra) bonus += 1;
        }
        if (!profile.topAuthors.includes(book.author)) {
            bonus += 0.5;
        }
    }
    
    return bonus;
}

/**
 * Applies backlog age scoring.
 * @param {Object} book - Book to score
 * @param {string} preference - User preference
 * @returns {number} Bonus score
 */
function applyBacklogScoring(book, preference) {
    if (!book.dateAdded) return 0;
    
    const yearsSinceAdded = (new Date() - new Date(book.dateAdded)) / (1000 * 60 * 60 * 24 * 365);
    
    if (preference === 'old') {
        // Bonus for older books
        if (yearsSinceAdded >= 3) return 2;
        if (yearsSinceAdded >= 1) return 1;
    } else if (preference === 'new') {
        // Bonus for newer books
        if (yearsSinceAdded < 1) return 2;
        if (yearsSinceAdded < 3) return 1;
    }
    
    return 0;
}

/**
 * Applies risk preference scoring.
 * @param {Object} book - Book to score
 * @param {string} preference - User preference
 * @param {Object} profile - User behaviour profile
 * @returns {number} Bonus score
 */
function applyRiskScoring(book, preference, profile) {
    const rating = book.averageRating || 0;
    
    if (preference === 'safe') {
        // Heavily weight high ratings
        return rating * 0.5;
    } else if (preference === 'risky') {
        // Prefer near user's average, avoid top 10%
        if (profile && profile.avgRating > 0) {
            const distanceFromAvg = Math.abs(rating - profile.avgRating);
            if (rating < profile.avgRating * 1.1 && rating >= 3.7 && rating <= 4.1) {
                return 1.5 - (distanceFromAvg * 0.3);
            }
        }
    }
    
    return 0;
}

/**
 * Renders the recommendation to the DOM.
 * @param {Object} recommendation - Recommendation result
 */
function renderRecommendation(recommendation) {
    const resultDiv = document.getElementById('recommendation-result');
    
    if (!recommendation || !recommendation.book) {
        resultDiv.innerHTML = '<p class="no-match">No recommendation available.</p>';
        return;
    }
    
    const book = recommendation.book;
    
    // Build cover HTML
    let coverHtml = '';
    if (book.isbn) {
        const isbn = book.isbn.replace(/[^0-9X]/gi, '');
        coverHtml = `
            <div class="book-cover-container">
                <img 
                    src="https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg" 
                    alt="Cover for ${book.title || 'Unknown Title'}"
                    class="book-cover"
                    loading="lazy"
                    onerror="this.style.display='none'; this.parentElement.classList.add('cover-error');"
                />
            </div>
        `;
    } else {
        coverHtml = `
            <div class="book-cover-container cover-placeholder">
                <div class="cover-placeholder-content">
                    <span class="cover-placeholder-icon">📚</span>
                    <p class="cover-placeholder-title">${book.title || 'Unknown Title'}</p>
                    <p class="cover-placeholder-author">${book.author || 'Unknown Author'}</p>
                </div>
            </div>
        `;
    }
    
    resultDiv.innerHTML = `
        <div class="recommendation-card">
            <h4>Recommended Book</h4>
            ${coverHtml}
            <div class="book-details">
                <p class="book-title">${book.title || 'Unknown Title'}</p>
                <p class="book-author">by ${book.author || 'Unknown Author'}</p>
                <div class="book-meta">
                    ${book.publicationYear ? `<span>Published: ${book.publicationYear}</span>` : ''}
                    ${book.pages ? `<span>Pages: ${book.pages}</span>` : ''}
                    ${book.averageRating ? `<span>Rating: ${book.averageRating.toFixed(2)}</span>` : ''}
                </div>
                <p class="book-score">Selected from ${recommendation.totalCandidates} candidates</p>
            </div>
        </div>
    `;
}

/**
 * Resets the decision flow to start over.
 */
function resetDecisionFlow() {
    // Reset state
    decisionState.currentStep = 1;
    decisionState.selections = {
        timeInvestment: '',
        behaviourPreference: '',
        backlogPreference: '',
        riskPreference: ''
    };
    decisionState.candidates = [...decisionState.allBooks];
    
    // Hide result
    document.getElementById('step-result').classList.add('hidden');
    
    // Clear selections
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Show step 1
    showStep(1);
    updateCandidateCount();
}

// Phase 5b: Helper Functions
// ============================================

/**
 * Gets user's reading behaviour profile from read books.
 * @returns {Object} Behaviour profile with dominant genres and patterns
 */
function getBehaviourProfile() {
    const readBooks = books.filter(b => b.dateRead !== null);
    
    if (readBooks.length === 0) {
        return { dominantGenres: [], avgLength: null, avgEra: null };
    }
    
    // Extract shelves from read books
    const shelves = extractShelvesFromBooks(readBooks);
    const shelfCounts = {};
    shelves.forEach(shelf => {
        shelfCounts[shelf] = (shelfCounts[shelf] || 0) + 1;
    });
    
    // Get top 3 dominant genres
    const dominantGenres = Object.entries(shelfCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([shelf]) => shelf.toLowerCase());
    
    // Calculate average length preference
    const booksWithPages = readBooks.filter(b => b.pages > 0);
    const avgLength = booksWithPages.length > 0 
        ? booksWithPages.reduce((sum, b) => sum + b.pages, 0) / booksWithPages.length 
        : null;
    
    // Calculate average era
    const booksWithYear = readBooks.filter(b => b.publicationYear > 0);
    const avgEra = booksWithYear.length > 0
        ? booksWithYear.reduce((sum, b) => sum + b.publicationYear, 0) / booksWithYear.length
        : null;
    
    return { dominantGenres, avgLength, avgEra };
}

/**
 * Extracts shelves from books, excluding default shelves.
 * @param {Array} books - Books to extract from
 * @returns {Array} Array of shelf names
 */
function extractShelvesFromBooks(books) {
    const ignoredShelves = ['read', 'currently-reading', 'to-read', 'want-to-read'];
    const allShelves = [];
    
    books.forEach(book => {
        if (!book.shelves) return;
        
        const shelves = book.shelves
            .split(',')
            .map(s => s.trim())
            .filter(s => s && !ignoredShelves.includes(s.toLowerCase()));
        
        allShelves.push(...shelves);
    });
    
    return allShelves;
}

/**
 * Scores a book using only local data (no enrichment required).
 * @param {Object} book - Book to score
 * @param {Object} filters - Filter criteria
 * @param {Object} behaviourProfile - User's reading behaviour profile
 * @returns {number} Score
 */
function scoreLocally(book, filters, behaviourProfile) {
    // Start with base score from average rating
    let score = book.averageRating || 0;
    
    // Add points for length alignment
    if (book.pages > 0) {
        // Behaviour alignment bonus
        if (behaviourProfile.avgLength) {
            const userPrefLength = behaviourProfile.avgLength < 350 ? 'short' :
                                  behaviourProfile.avgLength < 550 ? 'medium' :
                                  behaviourProfile.avgLength < 850 ? 'long' : 'epic';
            const bookLength = getLengthCategory(book.pages);
            if (bookLength === userPrefLength) {
                score += 0.5;
            }
        }
    }
    
    // Add points for era alignment
    if (book.publicationYear > 0) {
        // Behaviour alignment bonus
        if (behaviourProfile.avgEra) {
            const userPrefEra = behaviourProfile.avgEra < 1950 ? 'classic' :
                               behaviourProfile.avgEra <= 1999 ? 'late20th' : 'modern';
            const bookEra = getEraCategory(book.publicationYear);
            if (bookEra === userPrefEra) {
                score += 0.5;
            }
        }
    }
    
    return score;
}

/**
 * Selects top N candidates by score.
 * @param {Array} scored - Scored candidates
 * @param {number} limit - Number to select
 * @returns {Array} Top candidates
 */
function selectTopCandidates(scored, limit) {
    // Sort by score descending, then by average rating
    scored.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.book.averageRating - a.book.averageRating;
    });
    
    return scored.slice(0, limit);
}

/**
 * Gets length category for a book.
 * @param {number} pages - Page count
 * @returns {string|null} Category name or null
 */
function getLengthCategory(pages) {
    if (pages < 300) return 'short';
    if (pages <= 500) return 'medium';
    if (pages <= 800) return 'long';
    return 'epic';
}

/**
 * Gets era category for a book.
 * @param {number} year - Publication year
 * @returns {string|null} Category name or null
 */
function getEraCategory(year) {
    if (year < 1950) return 'classic';
    if (year <= 1999) return 'late20th';
    return 'modern';
}

// ============================================
// Phase 6: Lazy Enrichment System
// ============================================

const GENRE_MAP = {
    'fiction': ['Fiction', 'Literary Fiction', 'Contemporary Fiction'],
    'novel': ['Fiction', 'Literary Fiction'],
    'literary': ['Literary Fiction'],
    'thriller': ['Thriller', 'Mystery & Thriller'],
    'mystery': ['Mystery', 'Mystery & Thriller'],
    'crime': ['Crime', 'Mystery & Thriller'],
    'suspense': ['Thriller', 'Mystery & Thriller'],
    'horror': ['Horror'],
    'fantasy': ['Fantasy'],
    'science fiction': ['Science Fiction'],
    'sci-fi': ['Science Fiction'],
    'romance': ['Romance'],
    'historical': ['Historical Fiction'],
    'history': ['History', 'Non-Fiction'],
    'biography': ['Biography', 'Non-Fiction'],
    'memoir': ['Memoir', 'Biography', 'Non-Fiction'],
    'autobiography': ['Biography', 'Non-Fiction'],
    'non-fiction': ['Non-Fiction'],
    'nonfiction': ['Non-Fiction'],
    'self-help': ['Self-Help', 'Non-Fiction'],
    'business': ['Business', 'Non-Fiction'],
    'philosophy': ['Philosophy', 'Non-Fiction'],
    'psychology': ['Psychology', 'Non-Fiction'],
    'politics': ['Politics', 'Non-Fiction'],
    'economics': ['Economics', 'Non-Fiction'],
    'travel': ['Travel', 'Non-Fiction'],
    'humor': ['Humor', 'Comedy'],
    'comedy': ['Comedy', 'Humor'],
    'adventure': ['Adventure'],
    'action': ['Action', 'Adventure'],
    'war': ['War', 'Historical Fiction'],
    'dystopian': ['Dystopian', 'Science Fiction'],
    'post-apocalyptic': ['Post-Apocalyptic', 'Science Fiction'],
    'young adult': ['Young Adult'],
    'children': ['Children\'s'],
    'classics': ['Classics'],
    'poetry': ['Poetry'],
    'drama': ['Drama'],
    'lgbt': ['LGBTQ+'],
    'lgbtq': ['LGBTQ+'],
    'queer': ['LGBTQ+']
};

/**
 * Enriches a batch of candidate books.
 * Processes up to 3 books concurrently.
 * @param {Array} candidateBooks - Books to enrich
 * @param {number} limit - Maximum number to enrich (default: 10)
 */
async function enrichCandidates(candidateBooks, limit = 10) {
    // Filter to only books needing enrichment (have ISBN, no existing enrichment)
    let booksToEnrich = candidateBooks.filter(book => 
        book.isbn && !book.enrichment
    );
    
    // Limit to specified amount
    booksToEnrich = booksToEnrich.slice(0, limit);
    
    if (booksToEnrich.length === 0) {
        return;
    }
    
    // Process in batches of max 3 concurrent
    const batchSize = 3;
    for (let i = 0; i < booksToEnrich.length; i += batchSize) {
        const batch = booksToEnrich.slice(i, i + batchSize);
        await Promise.all(batch.map(book => enrichBook(book)));
    }
}

/**
 * Enriches a single book with Open Library data.
 * If enrichment fails, stores empty enrichment to prevent re-fetching.
 * @param {Object} book - Book to enrich
 */
async function enrichBook(book) {
    // Skip if already enriched
    if (book.enrichment) {
        return;
    }
    
    const isbn = book.isbn.replace(/[^0-9X]/gi, '');
    
    try {
        // Fetch ISBN data
        const isbnResponse = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
        if (!isbnResponse.ok) {
            throw new Error(`ISBN fetch failed: ${isbnResponse.status}`);
        }
        
        const isbnData = await isbnResponse.json();
        
        // Check for works
        if (!isbnData.works || isbnData.works.length === 0) {
            throw new Error('No works found for ISBN');
        }
        
        const workKey = isbnData.works[0].key;
        
        // Fetch work data
        const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
        if (!workResponse.ok) {
            throw new Error(`Work fetch failed: ${workResponse.status}`);
        }
        
        const workData = await workResponse.json();
        
        // Extract subjects
        const subjectsRaw = workData.subjects || [];
        
        // Map subjects to canonical genres
        const genres = mapSubjectsToGenres(subjectsRaw);
        
        // Extract cover ID
        const coverId = isbnData.covers?.[0] || workData.covers?.[0] || null;
        
        // Store enrichment
        book.enrichment = {
            subjectsRaw: subjectsRaw,
            genres: genres,
            coverId: coverId
        };
    } catch (error) {
        // Store empty enrichment to prevent re-fetching
        book.enrichment = {
            subjectsRaw: [],
            genres: [],
            coverId: null
        };
    }
}

/**
 * Maps raw subjects to canonical genres.
 * @param {Array} subjects - Raw subject strings
 * @returns {Array} Canonical genres
 */
function mapSubjectsToGenres(subjects) {
    const genres = new Set();
    
    subjects.forEach(subject => {
        const subjectLower = subject.toLowerCase();
        
        // Check each mapping
        for (const [keyword, mappedGenres] of Object.entries(GENRE_MAP)) {
            if (subjectLower.includes(keyword)) {
                mappedGenres.forEach(genre => genres.add(genre));
            }
        }
    });
    
    return Array.from(genres);
}


// ============================================
// Initialise
// ============================================

document.addEventListener("DOMContentLoaded", initUploadHandler);
