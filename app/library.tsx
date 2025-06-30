import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Modal,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

// Mock purchased books data
const mockPurchasedBooks = [
  {
    id: '1',
    title: 'Advanced Mathematics Grade 10',
    author: 'Dr. Sarah Johnson',
    subject: 'Math',
    grade: 'Grade 10',
    purchaseDate: '2024-01-15',
    coverImage: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
    isbn: '978-0-123456-78-9',
    publisher: 'Academic Press'
  },
  {
    id: '2',
    title: 'Life Sciences Fundamentals',
    author: 'Prof. Michael Brown',
    subject: 'Life Science',
    grade: 'Grade 10',
    purchaseDate: '2024-01-20',
    coverImage: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
    isbn: '978-0-987654-32-1',
    publisher: 'Science Publications'
  }
];

// Mock textbooks data for textbooks section
const mockTextbooks = [
  {
    id: '3',
    title: 'English Literature & Language',
    author: 'Emma Thompson',
    subject: 'English',
    grade: 'Grade 10',
    price: 249.99,
    coverImage: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
    description: 'Comprehensive English textbook covering literature analysis and language skills.',
    isbn: '978-0-456789-12-3',
    publisher: 'Language Arts Press',
    pages: 512,
    language: 'English'
  },
  {
    id: '4',
    title: 'Physics Principles',
    author: 'Dr. James Wilson',
    subject: 'Physics',
    grade: 'Grade 10',
    price: 329.99,
    coverImage: 'https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
    description: 'Essential physics concepts covering mechanics, waves, and energy.',
    isbn: '978-0-789123-45-6',
    publisher: 'Physics Press',
    pages: 624,
    language: 'English'
  }
];

// User's registered subjects and grade
const userProfile = {
  grade: 'Grade 10',
  subjects: ['Math', 'Life Science', 'English', 'Physics', 'Chemistry']
};

// Generate calendar data for current month
const generateCalendarData = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const calendar = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendar.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasContent = mockUploadedContent.some(content => content.uploadDate === dateString);
    const isToday = dateString === today.toISOString().split('T')[0];
    
    calendar.push({
      day,
      dateString,
      hasContent,
      isToday
    });
  }
  
  return {
    calendar,
    monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
};

export default function LibraryScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState<any>(null);
  const [showContentDetails, setShowContentDetails] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'image',
    subject: userProfile.subjects[0]
  });
  const [uploadedContent, setUploadedContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const { calendar, monthName } = generateCalendarData();

  useEffect(() => {
    // Load uploaded content from storage or API
    fetchUploadedContent();
  }, []);

  const fetchUploadedContent = async () => {
    // In a real app, this would fetch from your backend
    // For now, we'll use the mock data
    setUploadedContent(mockUploadedContent);
  };

  // Mock uploaded content with dates
  const mockUploadedContent = [
    {
      id: '1',
      title: 'Algebra Notes Chapter 5',
      type: 'image',
      subject: 'Math',
      uploadDate: new Date().toISOString().split('T')[0], // Today
      size: '2.3 MB',
      description: 'Handwritten notes covering quadratic equations and factoring methods.',
      thumbnail: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      fileUrl: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'
    },
    {
      id: '2',
      title: 'Biology Lab Report',
      type: 'pdf',
      subject: 'Life Science',
      uploadDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      size: '1.8 MB',
      description: 'Complete lab report on plant cell structure and function.',
      thumbnail: null,
      fileUrl: 'https://example.com/sample.pdf'
    },
    {
      id: '3',
      title: 'Shakespeare Analysis',
      type: 'image',
      subject: 'English',
      uploadDate: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
      size: '3.1 MB',
      description: 'Character analysis of Hamlet with key quotes and themes.',
      thumbnail: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      fileUrl: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'
    },
    {
      id: '4',
      title: 'Math Formula Sheet',
      type: 'image',
      subject: 'Math',
      uploadDate: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
      size: '1.2 MB',
      description: 'Essential formulas for trigonometry and calculus.',
      thumbnail: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      fileUrl: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop'
    }
  ];

  // Filter textbooks based on search and user's subjects/grade
  const filteredTextbooks = mockTextbooks.filter(book => {
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubjects = userProfile.subjects.includes(book.subject);
    const matchesGrade = book.grade === userProfile.grade;
    
    return matchesSearch && matchesSubjects && matchesGrade;
  });

  // Get recommended books when no search results
  const recommendedBooks = searchQuery && filteredTextbooks.length === 0 
    ? mockTextbooks.filter(book => 
        userProfile.subjects.includes(book.subject) && 
        book.grade === userProfile.grade
      )
    : [];

  // Filter uploaded content by selected date
  const filteredUploadedContent = selectedDate === 'all' 
    ? uploadedContent 
    : uploadedContent.filter(content => content.uploadDate === selectedDate);

  // Group filtered content by subject
  const groupedContent = filteredUploadedContent.reduce((acc, content) => {
    if (!acc[content.subject]) {
      acc[content.subject] = [];
    }
    acc[content.subject].push(content);
    return acc;
  }, {} as Record<string, typeof mockUploadedContent>);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        console.log('Document picking was canceled');
        return;
      }
      
      const file = result.assets[0];
      console.log('Picked document:', file);
      
      // Check file size (limit to 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        return;
      }
      
      setSelectedFile(file);
      
      // Set the file type in the form
      if (file.mimeType) {
        if (file.mimeType.startsWith('image/')) {
          setUploadForm(prev => ({ ...prev, type: 'image' }));
        } else if (file.mimeType === 'application/pdf') {
          setUploadForm(prev => ({ ...prev, type: 'pdf' }));
        }
      }
      
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your upload.');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, you would upload to Supabase Storage here
      // For this demo, we'll simulate a successful upload
      
      // Generate a unique ID for the new content
      const newId = Date.now().toString();
      
      // Create a new content object
      const newContent = {
        id: newId,
        title: uploadForm.title,
        type: uploadForm.type,
        subject: uploadForm.subject,
        uploadDate: new Date().toISOString().split('T')[0],
        size: selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
        description: `Uploaded ${uploadForm.type} for ${uploadForm.subject}`,
        thumbnail: uploadForm.type === 'image' ? selectedFile.uri : null,
        fileUrl: selectedFile.uri
      };
      
      // Add to uploaded content
      setUploadedContent(prev => [newContent, ...prev]);
      
      // Reset form
      setUploadForm({
        title: '',
        type: 'image',
        subject: userProfile.subjects[0]
      });
      setSelectedFile(null);
      
      // Close modal
      setShowUploadModal(false);
      
      Alert.alert(
        'Upload Successful',
        `Your ${uploadForm.type} "${uploadForm.title}" has been uploaded to ${uploadForm.subject}!`,
        [{ text: 'Great!' }]
      );
      
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    setShowCalendarModal(false);
  };

  const getSelectedDateDisplay = () => {
    if (selectedDate === 'all') return 'All Dates';
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const isFilterActive = () => {
    return selectedDate !== 'all';
  };

  const handleOpenBook = (book: any) => {
    Alert.alert(
      `📖 ${book.title}`,
      `Opening your book...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Book', style: 'default', onPress: () => {
          Alert.alert('Reading Mode', 'Book reader would open here.');
        }}
      ]
    );
  };

  const handleOpenContent = (content: any) => {
    if (content.fileUrl) {
      // For images, show in a modal
      if (content.type === 'image') {
        setShowContentDetails(content);
      } 
      // For PDFs, try to open in browser
      else if (content.type === 'pdf') {
        if (Platform.OS === 'web') {
          window.open(content.fileUrl, '_blank');
        } else {
          // On mobile, we would use Linking or WebBrowser
          Alert.alert(
            'View PDF',
            'Would you like to open this PDF?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open', onPress: () => {
                // In a real app, use Linking.openURL or WebBrowser.openBrowserAsync
                Alert.alert('PDF Viewer', 'PDF viewer would open here.');
              }}
            ]
          );
        }
      }
    } else {
      Alert.alert('Error', 'File not available.');
    }
  };

  const renderCalendarDay = (item: any, index: number) => {
    if (!item) {
      return <View key={index} style={styles.emptyCalendarDay} />;
    }

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          item.isToday && styles.todayCalendarDay,
          selectedDate === item.dateString && styles.selectedCalendarDay
        ]}
        onPress={() => handleDateSelect(item.dateString)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.calendarDayText,
          item.isToday && styles.todayCalendarDayText,
          selectedDate === item.dateString && styles.selectedCalendarDayText
        ]}>
          {item.day}
        </Text>
        {item.hasContent && (
          <View style={styles.contentDot} />
        )}
      </TouchableOpacity>
    );
  };

  const renderPurchasedBookCard = (book: any) => (
    <TouchableOpacity
      key={book.id}
      style={styles.purchasedBookCard}
      onPress={() => handleOpenBook(book)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: book.coverImage }}
        style={styles.purchasedBookCover}
        resizeMode="cover"
      />
      <View style={styles.purchasedBookInfo}>
        <Text style={styles.purchasedBookTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.purchasedBookAuthor}>{book.author}</Text>
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectBadgeText}>{book.subject}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTextbookCard = (book: any) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCard}
      onPress={() => setShowBookDetails(book)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: book.coverImage }}
        style={styles.bookCover}
        resizeMode="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>
        <View style={styles.bookMeta}>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectBadgeText}>{book.subject}</Text>
          </View>
          <Text style={styles.bookPrice}>R{book.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContentCard = (content: any) => (
    <TouchableOpacity
      key={content.id}
      style={styles.contentCard}
      onPress={() => handleOpenContent(content)}
      activeOpacity={0.8}
    >
      {content.thumbnail ? (
        <Image 
          source={{ uri: content.thumbnail }}
          style={styles.contentThumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.contentThumbnail, styles.contentPlaceholder]}>
          <Ionicons 
            name={content.type === 'pdf' ? 'document' : content.type === 'audio' ? 'musical-notes' : 'image'} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
      )}
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={2}>{content.title}</Text>
        <View style={styles.contentMeta}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{content.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.contentSize}>{content.size}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Library</Text>
        </View>

        {/* My Books Section - Only show if user has purchased books */}
        {mockPurchasedBooks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="library" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>My Books</Text>
              </View>
              <Text style={styles.bookCount}>{mockPurchasedBooks.length} book{mockPurchasedBooks.length > 1 ? 's' : ''}</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.purchasedBooksContainer}
            >
              {mockPurchasedBooks.map(renderPurchasedBookCard)}
            </ScrollView>
          </View>
        )}

        {/* Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="book" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Books</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books by title, barcode, or author"
              placeholderTextColor={`${theme.colors.secondary}60`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Books Grid */}
          <View style={styles.booksGrid}>
            {filteredTextbooks.length > 0 ? (
              filteredTextbooks.map(renderTextbookCard)
            ) : recommendedBooks.length > 0 ? (
              <>
                <Text style={styles.recommendedTitle}>
                  Recommended Books
                </Text>
                {recommendedBooks.map(renderTextbookCard)}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={48} color={theme.colors.primary} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No books found' : 'No books available'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Uploaded Content Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="folder" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Uploaded Content</Text>
            </View>
            <View style={styles.sectionActions}>
              <TouchableOpacity 
                style={[
                  styles.filterButton,
                  isFilterActive() && styles.filterButtonActive
                ]}
                onPress={() => setShowCalendarModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="calendar" 
                  size={16} 
                  color={isFilterActive() ? theme.colors.base : theme.colors.secondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => setShowUploadModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={theme.colors.base} />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Indicator */}
          {isFilterActive() && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIndicatorText}>
                Showing content from {getSelectedDateDisplay()}
              </Text>
              <TouchableOpacity 
                style={styles.showAllButton}
                onPress={() => setSelectedDate('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.showAllButtonText}>Show All</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content by Subject */}
          {Object.keys(groupedContent).length > 0 ? (
            Object.entries(groupedContent).map(([subject, contents]) => (
              <View key={subject} style={styles.subjectGroup}>
                <Text style={styles.subjectGroupTitle}>{subject}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.contentScrollContainer}
                >
                  {contents.map(renderContentCard)}
                </ScrollView>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.primary} />
              <Text style={styles.emptyStateText}>
                {selectedDate === 'all' 
                  ? 'No uploaded content yet' 
                  : 'No content uploaded on this day'
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedDate === 'all'
                  ? 'Upload your notes, images, and study materials'
                  : 'Try selecting a different date or upload new content'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>{monthName}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCalendarModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Legend */}
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
                <Text style={styles.legendText}>Has Content</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
            </View>

            {/* Days of Week Header */}
            <View style={styles.calendarWeekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendar.map((item, index) => renderCalendarDay(item, index))}
            </View>

            {/* Show All Button */}
            <TouchableOpacity 
              style={styles.showAllCalendarButton}
              onPress={() => handleDateSelect('all')}
              activeOpacity={0.8}
            >
              <Text style={styles.showAllCalendarButtonText}>Show All Dates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Content</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUploadModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter title for your upload"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={uploadForm.title}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, title: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>File Type</Text>
                <View style={styles.typeOptions}>
                  {[
                    { key: 'image', label: 'Images', icon: 'image', free: true },
                    { key: 'pdf', label: 'PDF', icon: 'document', free: false },
                    { key: 'audio', label: 'Audio', icon: 'musical-notes', free: false }
                  ].map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        uploadForm.type === type.key && styles.selectedTypeOption,
                        !type.free && styles.premiumTypeOption
                      ]}
                      onPress={() => setUploadForm(prev => ({ ...prev, type: type.key }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={20} 
                        color={uploadForm.type === type.key ? theme.colors.base : theme.colors.secondary} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        uploadForm.type === type.key && styles.selectedTypeOptionText
                      ]}>
                        {type.label}
                      </Text>
                      {!type.free && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <View style={styles.subjectOptions}>
                  {userProfile.subjects.map(subject => (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        styles.subjectOption,
                        uploadForm.subject === subject && styles.selectedSubjectOption
                      ]}
                      onPress={() => setUploadForm(prev => ({ ...prev, subject }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.subjectOptionText,
                        uploadForm.subject === subject && styles.selectedSubjectOptionText
                      ]}>
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select File</Text>
                <TouchableOpacity 
                  style={styles.filePickerButton}
                  onPress={pickDocument}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload" size={20} color={theme.colors.primary} />
                  <Text style={styles.filePickerText}>
                    {selectedFile ? selectedFile.name : 'Choose a file'}
                  </Text>
                </TouchableOpacity>
                {selectedFile && (
                  <Text style={styles.selectedFileInfo}>
                    {selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                    {selectedFile.mimeType ? ` • ${selectedFile.mimeType}` : ''}
                  </Text>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.uploadSubmitButton,
                  (!uploadForm.title.trim() || !selectedFile) && styles.disabledButton
                ]}
                onPress={handleUpload}
                disabled={!uploadForm.title.trim() || !selectedFile || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <Text style={styles.uploadSubmitButtonText}>Uploading...</Text>
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color={theme.colors.base} />
                    <Text style={styles.uploadSubmitButtonText}>Upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Book Details Modal */}
      {showBookDetails && (
        <Modal
          visible={!!showBookDetails}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBookDetails(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Details</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowBookDetails(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsContent}>
                  <Image 
                    source={{ uri: showBookDetails.coverImage }}
                    style={styles.detailsCover}
                    resizeMode="cover"
                  />
                  
                  <Text style={styles.detailsTitle}>{showBookDetails.title}</Text>
                  <Text style={styles.detailsAuthor}>by {showBookDetails.author}</Text>
                  
                  <View style={styles.detailsMeta}>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Subject</Text>
                      <Text style={styles.detailsMetaValue}>{showBookDetails.subject}</Text>
                    </View>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Grade</Text>
                      <Text style={styles.detailsMetaValue}>{showBookDetails.grade}</Text>
                    </View>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Pages</Text>
                      <Text style={styles.detailsMetaValue}>{showBookDetails.pages}</Text>
                    </View>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>ISBN</Text>
                      <Text style={styles.detailsMetaValue}>{showBookDetails.isbn}</Text>
                    </View>
                  </View>

                  <Text style={styles.detailsDescription}>{showBookDetails.description}</Text>
                  
                  <View style={styles.detailsPrice}>
                    <Text style={styles.priceText}>R{showBookDetails.price}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.purchaseButton}
                    disabled={true}
                    onPress={() => {
                      Alert.alert('Purchase', `Purchase functionality for "${showBookDetails.title}" would be implemented here.`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="card" size={20} color={theme.colors.base} />
                    <Text style={styles.purchaseButtonText}>Purchase Book</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Content Details Modal */}
      {showContentDetails && (
        <Modal
          visible={!!showContentDetails}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowContentDetails(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Content Details</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowContentDetails(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsContent}>
                  {showContentDetails.type === 'image' && showContentDetails.fileUrl ? (
                    <Image 
                      source={{ uri: showContentDetails.fileUrl }}
                      style={styles.contentFullImage}
                      resizeMode="contain"
                    />
                  ) : showContentDetails.thumbnail ? (
                    <Image 
                      source={{ uri: showContentDetails.thumbnail }}
                      style={styles.detailsCover}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.detailsCover, styles.contentPlaceholder]}>
                      <Ionicons 
                        name={showContentDetails.type === 'pdf' ? 'document' : showContentDetails.type === 'audio' ? 'musical-notes' : 'image'} 
                        size={48} 
                        color={theme.colors.primary} 
                      />
                    </View>
                  )}
                  
                  <Text style={styles.detailsTitle}>{showContentDetails.title}</Text>
                  
                  <View style={styles.detailsMeta}>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Type</Text>
                      <Text style={styles.detailsMetaValue}>{showContentDetails.type.toUpperCase()}</Text>
                    </View>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Subject</Text>
                      <Text style={styles.detailsMetaValue}>{showContentDetails.subject}</Text>
                    </View>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Size</Text>
                      <Text style={styles.detailsMetaValue}>{showContentDetails.size}</Text>
                    </View>
                    <View style={styles.detailsMetaItem}>
                      <Text style={styles.detailsMetaLabel}>Upload Date</Text>
                      <Text style={styles.detailsMetaValue}>
                        {new Date(showContentDetails.uploadDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailsDescription}>{showContentDetails.description}</Text>

                  <TouchableOpacity 
                    style={styles.openContentButton}
                    onPress={() => {
                      if (showContentDetails.fileUrl) {
                        if (Platform.OS === 'web') {
                          window.open(showContentDetails.fileUrl, '_blank');
                        } else {
                          // On mobile, we would use Linking or WebBrowser
                          Alert.alert('Opening Content', `Opening "${showContentDetails.title}" in external viewer.`);
                        }
                      } else {
                        Alert.alert('Error', 'File not available.');
                      }
                      setShowContentDetails(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="open" size={20} color={theme.colors.base} />
                    <Text style={styles.openContentButtonText}>Open Content</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.base,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}60`,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  bookCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  uploadButtonText: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '600',
  },
  purchasedBooksContainer: {
    paddingRight: 16,
    gap: 16,
  },
  purchasedBookCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    width: 200,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}10`,
  },
  purchasedBookCover: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  purchasedBookInfo: {
    flex: 1,
  },
  purchasedBookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  purchasedBookAuthor: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  filterIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  showAllButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showAllButtonText: {
    color: theme.colors.base,
    fontSize: 12,
    fontWeight: '600',
  },
  booksGrid: {
    gap: 12,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  bookCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBadge: {
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  bookPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  subjectGroup: {
    marginBottom: 20,
  },
  subjectGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 12,
  },
  contentScrollContainer: {
    paddingRight: 16,
    gap: 12,
  },
  contentCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    width: 140,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  contentPlaceholder: {
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 6,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: `${theme.colors.accent}20`,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  contentSize: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.9,
    maxWidth: 400,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  emptyCalendarDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
  },
  todayCalendarDay: {
    backgroundColor: theme.colors.primary,
  },
  selectedCalendarDay: {
    backgroundColor: theme.colors.accent,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  todayCalendarDayText: {
    color: theme.colors.base,
  },
  selectedCalendarDayText: {
    color: theme.colors.base,
  },
  contentDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  showAllCalendarButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  showAllCalendarButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadModal: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  uploadForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    position: 'relative',
  },
  selectedTypeOption: {
    backgroundColor: theme.colors.primary,
  },
  premiumTypeOption: {
    opacity: 0.7,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  selectedTypeOptionText: {
    color: theme.colors.base,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.base,
  },
  subjectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectOption: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedSubjectOption: {
    backgroundColor: theme.colors.primary,
  },
  subjectOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  selectedSubjectOptionText: {
    color: theme.colors.base,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  filePickerText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    flex: 1,
  },
  selectedFileInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
    marginTop: 4,
    marginLeft: 4,
  },
  uploadSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: `${theme.colors.primary}60`,
    shadowOpacity: 0.1,
  },
  uploadSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.base,
  },
  detailsModal: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
  },
  detailsContent: {
    alignItems: 'center',
  },
  detailsCover: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  contentFullImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsAuthor: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsMeta: {
    width: '100%',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  detailsMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsMetaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  detailsMetaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  detailsDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsPrice: {
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.accent,
    textAlign: 'center',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  openContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  openContentButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
});