import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Book, Upload, Download, Search, Filter, X, FileText, Image as ImageIcon, Music } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface BookDetails {
  id: string;
  title: string;
  author: string;
  subject: string;
  grade: string;
  price: number;
  coverImage: string;
  description: string;
  rating: number;
  reviews: number;
  isPurchased?: boolean;
}

interface UserContent {
  id: string;
  title: string;
  type: 'image' | 'pdf' | 'audio';
  subject: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  file_size: string;
  upload_date: string;
}

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'textbooks' | 'purchased' | 'uploads'>('textbooks');
  const [showBookDetails, setShowBookDetails] = useState<BookDetails | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [userContent, setUserContent] = useState<UserContent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    description: '',
    type: 'pdf' as 'image' | 'pdf' | 'audio',
  });
  const [userSubjects, setUserSubjects] = useState<string[]>([]);

  // Sample data for textbooks
  const allTextbooks: BookDetails[] = [
    {
      id: '1',
      title: 'Advanced Mathematics Grade 12',
      author: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      grade: 'Grade 12',
      price: 299,
      coverImage: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg',
      description: 'Comprehensive mathematics textbook covering all Grade 12 topics including calculus, algebra, and geometry.',
      rating: 4.8,
      reviews: 156,
    },
    {
      id: '2',
      title: 'Physical Sciences Explained',
      author: 'Prof. Michael Chen',
      subject: 'Physical Sciences',
      grade: 'Grade 11',
      price: 349,
      coverImage: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg',
      description: 'In-depth coverage of physics and chemistry concepts with practical examples and experiments.',
      rating: 4.6,
      reviews: 89,
    },
    {
      id: '3',
      title: 'Life Sciences Fundamentals',
      author: 'Dr. Emily Rodriguez',
      subject: 'Life Sciences',
      grade: 'Grade 10',
      price: 279,
      coverImage: 'https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg',
      description: 'Complete guide to biology covering cell biology, genetics, ecology, and human physiology.',
      rating: 4.7,
      reviews: 203,
    },
    {
      id: '4',
      title: 'English Literature & Language',
      author: 'Prof. James Wilson',
      subject: 'English Home Language',
      grade: 'Grade 12',
      price: 259,
      coverImage: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg',
      description: 'Comprehensive English textbook covering literature analysis, creative writing, and language skills.',
      rating: 4.5,
      reviews: 134,
    },
    {
      id: '5',
      title: 'Afrikaans First Additional Language',
      author: 'Dr. Annika van der Merwe',
      subject: 'Afrikaans First Additional Language',
      grade: 'Grade 11',
      price: 245,
      coverImage: 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg',
      description: 'Complete Afrikaans language textbook with grammar, vocabulary, and literature studies for Grade 11 students.',
      rating: 4.3,
      reviews: 78,
    },
    {
      id: '6',
      title: 'Business Studies: Entrepreneurship & Management',
      author: 'Prof. David Thompson',
      subject: 'Business Studies',
      grade: 'Grade 10',
      price: 289,
      coverImage: 'https://images.pexels.com/photos/6476254/pexels-photo-6476254.jpeg',
      description: 'Comprehensive guide to business concepts, entrepreneurship, and management principles for Grade 10 students.',
      rating: 4.6,
      reviews: 92,
    },
    {
      id: '7',
      title: 'Life Orientation: Personal Development',
      author: 'Dr. Thabo Mbeki',
      subject: 'Life Orientation',
      grade: 'Grade 9',
      price: 199,
      coverImage: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
      description: 'Essential guide to personal development, health, careers, and citizenship for Grade 9 students.',
      rating: 4.4,
      reviews: 65,
    },
    {
      id: '8',
      title: 'Geography: Our Dynamic Earth',
      author: 'Dr. Lisa Patel',
      subject: 'Geography',
      grade: 'Grade 11',
      price: 275,
      coverImage: 'https://images.pexels.com/photos/2859169/pexels-photo-2859169.jpeg',
      description: 'Comprehensive geography textbook covering physical geography, human geography, and environmental studies.',
      rating: 4.7,
      reviews: 103,
    },
    {
      id: '9',
      title: 'History: South Africa and the World',
      author: 'Prof. Nkosi Ndlovu',
      subject: 'History',
      grade: 'Grade 12',
      price: 265,
      coverImage: 'https://images.pexels.com/photos/2128249/pexels-photo-2128249.jpeg',
      description: 'In-depth exploration of South African and world history for Grade 12 students preparing for final exams.',
      rating: 4.8,
      reviews: 124,
    },
    {
      id: '10',
      title: 'Mathematical Literacy Essentials',
      author: 'Dr. Rachel Green',
      subject: 'Mathematical Literacy',
      grade: 'Grade 10',
      price: 235,
      coverImage: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg',
      description: 'Practical mathematical literacy textbook focusing on real-world applications and problem-solving.',
      rating: 4.5,
      reviews: 87,
    }
  ];

  // Sample purchased books
  const purchasedBooks: BookDetails[] = [
    { ...allTextbooks[0], isPurchased: true },
    { ...allTextbooks[2], isPurchased: true },
  ];

  useEffect(() => {
    if (user) {
      // Set initial subject from user's subjects if available
      if (user.subjects && user.subjects.length > 0) {
        setUserSubjects(['All', ...user.subjects]);
        setUploadForm(prev => ({ ...prev, subject: user.subjects[0] }));
      }
    }
    fetchUserContent();
  }, [user]);

  const fetchUserContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_content')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setUserContent(data || []);
    } catch (error) {
      console.error('Error fetching user content:', error);
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      let result;

      if (uploadForm.type === 'image') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: uploadForm.type === 'pdf' ? 'application/pdf' : 'audio/*',
          copyToCacheDirectory: true,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(asset);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (asset: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      try {
        // Read file as base64
        const fileUri = asset.uri;
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Create file path
        const fileExt = asset.name?.split('.').pop() || 'bin';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user_content')
          .upload(filePath, decode(fileBase64), {
            contentType: asset.mimeType || 'application/octet-stream',
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user_content')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('user_content')
          .insert({
            user_id: user.id,
            title: uploadForm.title,
            type: uploadForm.type,
            subject: uploadForm.subject,
            description: uploadForm.description,
            file_url: publicUrl,
            file_size: formatFileSize(asset.size || 0),
          });

        if (dbError) throw dbError;

        Alert.alert('Success', 'File uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({ title: '', subject: '', description: '', type: 'pdf' });
        fetchUserContent();
      } catch (error) {
        console.error('Error in file upload process:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePurchase = (book: BookDetails) => {
    Alert.alert(
      'Purchase Book',
      `Would you like to purchase "${book.title}" for R${book.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase', onPress: () => processPurchase(book) },
      ]
    );
  };

  const processPurchase = (book: BookDetails) => {
    // Simulate purchase process
    Alert.alert('Success', 'Book purchased successfully!');
    setShowBookDetails(null);
  };

  const handleOpenBook = (book: BookDetails) => {
    if (book.isPurchased) {
      // Open book reader
      Alert.alert('Opening Book', `Opening "${book.title}" for reading...`);
    } else {
      setShowBookDetails(book);
    }
  };

  const handleOpenContent = (content: UserContent) => {
    if (content.type === 'pdf') {
      setShowPDFViewer(content.file_url);
    } else if (content.type === 'image') {
      Alert.alert('Image Viewer', 'Opening image viewer...');
    } else if (content.type === 'audio') {
      Alert.alert('Audio Player', 'Opening audio player...');
    }
  };

  // Filter textbooks based on user's grade and subjects
  const filteredTextbooks = allTextbooks.filter((book) => {
    // Only show books that match the user's subjects
    const matchesUserSubject = user?.subjects?.includes(book.subject) || false;
    // Only show books that match the user's grade
    const matchesUserGrade = user?.grade === book.grade;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || book.subject === selectedSubject;
    return matchesSearch && matchesSubject && matchesUserSubject && matchesUserGrade;
  });

  const filteredPurchased = purchasedBooks.filter((book) => {
    // Only show books that match the user's subjects
    const matchesUserSubject = user?.subjects?.includes(book.subject) || false;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || book.subject === selectedSubject;
    return matchesSearch && matchesSubject && matchesUserSubject;
  });

  const filteredContent = userContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || content.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const renderTextbookCard = (book: BookDetails) => (
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
        <View>
          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author} • {book.grade}</Text>
        </View>
        <View style={styles.bookMeta}>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectBadgeText}>{book.subject}</Text>
          </View>
          <Text style={styles.bookPrice}>R{book.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPurchasedBookCard = (book: BookDetails) => (
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
        <Text style={styles.purchasedBookAuthor}>{book.author} • {book.grade}</Text>
        <View style={styles.bookMeta}>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectBadgeText}>{book.subject}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContentCard = (content: UserContent) => (
    <TouchableOpacity
      key={content.id}
      style={styles.contentCard}
      onPress={() => handleOpenContent(content)}
      activeOpacity={0.8}
    >
      <View style={styles.contentIcon}>
        {content.type === 'pdf' && <FileText size={24} color="#6366f1" />}
        {content.type === 'image' && <ImageIcon size={24} color="#10b981" />}
        {content.type === 'audio' && <Music size={24} color="#f59e0b" />}
      </View>
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={2}>{content.title}</Text>
        <Text style={styles.contentMeta}>{content.subject} • {content.file_size}</Text>
        <Text style={styles.contentDate}>{new Date(content.upload_date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowUploadModal(true)}
        >
          <Upload size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books and content..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {userSubjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterChip,
                selectedSubject === subject && styles.filterChipActive
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text style={[
                styles.filterChipText,
                selectedSubject === subject && styles.filterChipTextActive
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'textbooks' && styles.activeTab]}
          onPress={() => setActiveTab('textbooks')}
        >
          <Book size={20} color={activeTab === 'textbooks' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'textbooks' && styles.activeTabText]}>
            Textbooks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchased' && styles.activeTab]}
          onPress={() => setActiveTab('purchased')}
        >
          <Download size={20} color={activeTab === 'purchased' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'purchased' && styles.activeTabText]}>
            My Books
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'uploads' && styles.activeTab]}
          onPress={() => setActiveTab('uploads')}
        >
          <Upload size={20} color={activeTab === 'uploads' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'uploads' && styles.activeTabText]}>
            My Uploads
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'textbooks' && (
          <View style={styles.booksGrid}>
            {filteredTextbooks.map(renderTextbookCard)}
            {filteredTextbooks.length === 0 && (
              <View style={styles.emptyState}>
                <Book size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No recommended textbooks found</Text>
                <Text style={styles.emptyStateSubtext}>
                  We couldn't find any textbooks matching your grade ({user?.grade || 'Unknown'}) and subjects.
                  {!user?.subjects?.length && " Please update your profile with your subjects."}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'purchased' && (
          <View style={styles.booksGrid}>
            {filteredPurchased.length > 0 ? (
              filteredPurchased.map(renderPurchasedBookCard)
            ) : (
              <View style={styles.emptyState}>
                <Book size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No purchased books yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Browse textbooks to start building your library
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'uploads' && (
          <View style={styles.contentGrid}>
            {filteredContent.length > 0 ? (
              filteredContent.map(renderContentCard)
            ) : (
              <View style={styles.emptyState}>
                <Upload size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No uploads yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Upload your study materials to access them anywhere
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Book Details Modal */}
      <Modal
        visible={!!showBookDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {showBookDetails && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowBookDetails(null)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Image
                source={{ uri: showBookDetails.coverImage }}
                style={styles.modalBookCover}
                resizeMode="cover"
              />
              
              <View style={styles.modalBookInfo}>
                <Text style={styles.modalBookTitle}>{showBookDetails.title}</Text>
                <Text style={styles.modalBookAuthor}>by {showBookDetails.author}</Text>
                
                <View style={styles.modalBookMeta}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{showBookDetails.subject}</Text>
                    <Text style={styles.gradeBadgeText}> • {showBookDetails.grade}</Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#fbbf24" />
                    <Text style={styles.ratingText}>{showBookDetails.rating}</Text>
                    <Text style={styles.reviewsText}>({showBookDetails.reviews} reviews)</Text>
                  </View>
                </View>
                
                <Text style={styles.modalBookDescription}>{showBookDetails.description}</Text>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Price</Text>
                  <Text style={styles.priceValue}>R{showBookDetails.price}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.purchaseButton}
                  onPress={() => handlePurchase(showBookDetails)}
                >
                  <Text style={styles.purchaseButtonText}>Purchase Book</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Content</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.uploadForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.formInput}
                  value={uploadForm.title}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, title: text }))}
                  placeholder="Enter title..."
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subject</Text>
                {user?.subjects && user.subjects.length > 0 ? (
                  <View style={styles.subjectSelector}>
                    {user.subjects.map((subject) => (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.subjectOption,
                          uploadForm.subject === subject && styles.subjectOptionActive
                        ]}
                        onPress={() => setUploadForm(prev => ({ ...prev, subject }))}
                      >
                        <Text style={[
                          styles.subjectOptionText,
                          uploadForm.subject === subject && styles.subjectOptionTextActive
                        ]}>
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={styles.formInput}
                    value={uploadForm.subject}
                    onChangeText={(text) => setUploadForm(prev => ({ ...prev, subject: text }))}
                    placeholder="Enter subject..."
                    placeholderTextColor="#9ca3af"
                  />
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  {(['pdf', 'image', 'audio'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        uploadForm.type === type && styles.typeOptionActive
                      ]}
                      onPress={() => setUploadForm(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        uploadForm.type === type && styles.typeOptionTextActive
                      ]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={uploadForm.description}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, description: text }))}
                  placeholder="Enter description..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.uploadFileButton, isUploading && styles.uploadFileButtonDisabled]}
                onPress={handleUpload}
                disabled={isUploading || !uploadForm.title || !uploadForm.subject}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Upload size={20} color="#fff" />
                    <Text style={styles.uploadFileButtonText}>Select & Upload File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        visible={!!showPDFViewer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.pdfViewerContainer}>
          <View style={styles.pdfViewerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPDFViewer(null)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.pdfViewerTitle}>PDF Viewer</Text>
          </View>
          
          {showPDFViewer && (
            <WebView
              source={{ uri: showPDFViewer }}
              style={styles.pdfViewer}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.pdfLoading}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  booksGrid: {
    gap: 16,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBadge: {
    backgroundColor: '#ddd6fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  gradeBadgeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  bookPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  purchasedBookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  purchasedBookCover: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  purchasedBookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  purchasedBookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  purchasedBookAuthor: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  contentGrid: {
    gap: 12,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalBookCover: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalBookInfo: {
    gap: 16,
  },
  modalBookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBookAuthor: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalBookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  modalBookDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  purchaseButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadForm: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  subjectSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  subjectOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  subjectOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  subjectOptionTextActive: {
    color: '#fff',
  },
  uploadFileButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadFileButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadFileButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pdfViewerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 16,
  },
  pdfViewer: {
    flex: 1,
  },
  pdfLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pdfLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});