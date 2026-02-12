// ============================================
// Library Insights - Phase 1: Data Ingestion
// ============================================

// Global state - holds all parsed book data
let books = [];

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
        userRating: parseFloatOrZero(row['My Rating'] || row.userRating || row['My Rating']),
        
        // Date fields
        dateRead: cleanString(row['Date Read'] || row.dateRead || null),
        dateAdded: cleanString(row['Date Added'] || row.dateAdded || null),
        
        // Categorisation
        shelves: cleanString(row.Bookshelves || row.shelves || ''),
        
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
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        processCSV(file);
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
                <p class="metric-description">Your reading activity over time</p>
    `;
    
    // Add books per year (last 10 years only)
    const currentYear = new Date().getFullYear();
    const yearEntries = Object.entries(metrics.booksPerYear)
        .filter(([year]) => year >= currentYear - 9)
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
// Phase 5: Decision Engine
// ============================================

/**
 * Initialises the decision engine.
 * @param {Array} wantToReadBooks - Books marked as "want to read"
 */
function initDecisionEngine(wantToReadBooks) {
    const decisionSection = document.getElementById('decision-engine-section');
    const genreFilter = document.getElementById('genre-filter');
    const recommendBtn = document.getElementById('recommend-btn');
    
    // Show the decision engine section
    decisionSection.classList.remove('hidden');
    
    // Populate genre dropdown
    populateGenreDropdown(wantToReadBooks, genreFilter);
    
    // Attach event listener to recommend button
    recommendBtn.addEventListener('click', () => {
        const filters = getDecisionFilters();
        const recommendation = runDecisionEngine(wantToReadBooks, filters);
        renderRecommendation(recommendation);
    });
}

/**
 * Populates the genre dropdown from unique shelves.
 * @param {Array} books - Books to extract shelves from
 * @param {HTMLSelectElement} select - Genre select element
 */
function populateGenreDropdown(books, select) {
    const shelves = extractShelvesFromBooks(books);
    const shelfCounts = {};
    
    shelves.forEach(shelf => {
        shelfCounts[shelf] = (shelfCounts[shelf] || 0) + 1;
    });
    
    // Only include shelves appearing at least twice
    const frequentShelves = Object.entries(shelfCounts)
        .filter(([shelf, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1]);
    
    frequentShelves.forEach(([shelf, count]) => {
        const option = document.createElement('option');
        option.value = shelf.toLowerCase();
        option.textContent = `${shelf} (${count})`;
        select.appendChild(option);
    });
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
 * Gets current filter values from UI.
 * @returns {Object} Filter values
 */
function getDecisionFilters() {
    return {
        genre: document.getElementById('genre-filter').value,
        length: document.getElementById('length-filter').value,
        era: document.getElementById('era-filter').value,
        minRating: parseFloat(document.getElementById('rating-filter').value) || 0
    };
}

/**
 * Runs the decision engine to find a recommendation.
 * @param {Array} books - Books to choose from
 * @param {Object} filters - Filter criteria
 * @returns {Object|null} Recommended book or null
 */
function runDecisionEngine(books, filters) {
    if (!books || books.length === 0) {
        return null;
    }
    
    // Filter books by minimum rating
    let candidates = books.filter(book => book.averageRating >= filters.minRating);
    
    if (candidates.length === 0) {
        return { noMatch: true, reason: 'No books match the minimum rating filter' };
    }
    
    // Score each candidate
    const scored = candidates.map(book => ({
        book: book,
        score: scoreBook(book, filters)
    }));
    
    // Sort by score descending, then by average rating
    scored.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.book.averageRating - a.book.averageRating;
    });
    
    const winner = scored[0];
    
    return {
        book: winner.book,
        score: winner.score,
        totalCandidates: scored.length
    };
}

/**
 * Scores a book based on filter preferences.
 * @param {Object} book - Book to score
 * @param {Object} filters - Filter criteria
 * @returns {number} Score
 */
function scoreBook(book, filters) {
    // Start with normalized average rating
    let score = book.averageRating || 0;
    
    // Add points for genre match
    if (filters.genre && book.shelves) {
        const bookShelves = book.shelves.toLowerCase().split(',').map(s => s.trim());
        if (bookShelves.includes(filters.genre)) {
            score += 2;
        }
    }
    
    // Add points for length match
    if (filters.length && book.pages > 0) {
        const lengthMatch = getLengthCategory(book.pages);
        if (lengthMatch === filters.length) {
            score += 1;
        }
    }
    
    // Add points for era match
    if (filters.era && book.publicationYear > 0) {
        const eraMatch = getEraCategory(book.publicationYear);
        if (eraMatch === filters.era) {
            score += 1;
        }
    }
    
    return score;
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

/**
 * Renders the recommendation to the DOM.
 * @param {Object} recommendation - Recommendation result
 */
function renderRecommendation(recommendation) {
    const resultDiv = document.getElementById('recommendation-result');
    
    if (!recommendation) {
        resultDiv.innerHTML = '<p class="no-match">No books available for recommendation.</p>';
        return;
    }
    
    if (recommendation.noMatch) {
        resultDiv.innerHTML = `<p class="no-match">${recommendation.reason}</p>`;
        return;
    }
    
    const book = recommendation.book;
    
    resultDiv.innerHTML = `
        <div class="recommendation-card">
            <h4>Recommended Book</h4>
            <div class="book-details">
                <p class="book-title">${book.title || 'Unknown Title'}</p>
                <p class="book-author">by ${book.author || 'Unknown Author'}</p>
                <div class="book-meta">
                    ${book.publicationYear ? `<span>Published: ${book.publicationYear}</span>` : ''}
                    ${book.pages ? `<span>Pages: ${book.pages}</span>` : ''}
                    ${book.averageRating ? `<span>Average Rating: ${book.averageRating.toFixed(2)}</span>` : ''}
                </div>
                <p class="book-score">Score: ${recommendation.score.toFixed(1)} (from ${recommendation.totalCandidates} candidates)</p>
            </div>
        </div>
    `;
}

// ============================================
// Initialise
// ============================================

document.addEventListener('DOMContentLoaded', initUploadHandler);
