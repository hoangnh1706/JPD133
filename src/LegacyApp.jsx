import React, { useState, useEffect, useCallback, useMemo } from 'react';
import imageQuestionsData from './data/questions.json';
import noImageQuestionsData from './data/no_image_questions.json';
import readingPassagesData from './data/reading_passages.json';
import { useSpeech } from './hooks/useSpeech';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NoImageSidebar from './components/NoImageSidebar';
import ReadingSidebar from './components/ReadingSidebar';
import PracticeCard from './components/PracticeCard';
import NoImagePracticeCard from './components/NoImagePracticeCard';
import ReadingPracticeCard from './components/ReadingPracticeCard';
import VocabPractice from './components/VocabPractice';
import AiLookupView from './components/AiLookupView';
import AiSettingsModal from './components/AiSettingsModal';
import GeneralDrawer from './components/GeneralDrawer';
import MockTestModal from './components/MockTestModal';

const STORAGE_IMAGE_KEY = 'jpd133_progress_v1';
const STORAGE_NO_IMAGE_KEY = 'jpd133_no_image_progress_v1';
const STORAGE_READING_KEY = 'jpd133_reading_progress_v1';
const SPEED_KEY = 'jpd133_speed_v1';
const FURIGANA_KEY = 'jpd133_furigana_v1';

export default function App() {
  // Tabs: 'image' (102 Hình) | 'no-image' (39 Câu không hình) | 'reading' (16 Bài đọc) | 'mocktest'
  const [activeTab, setActiveTab] = useState('image');

  // Sidebar toggle state (cho các tab luyện tập có danh sách: 102 Hình, 39 Phản xạ, 16 Bài đọc)
  // Mặc định mở cố định bên ngoài trên Desktop/Laptop (>= 1024px) theo yêu cầu người dùng
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Drawer state cho tab từ vựng / AI lookup
  const [isGeneralDrawerOpen, setIsGeneralDrawerOpen] = useState(false);

  // AI Settings Modal state
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  // Settings
  const [speed, setSpeed] = useState(() => {
    const saved = localStorage.getItem(SPEED_KEY);
    return saved ? Number(saved) : 1.0;
  });

  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem(FURIGANA_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Progress State for 102 Image Questions
  const [progressImage, setProgressImage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_IMAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Progress State for 39 No-Image Questions
  const [progressNoImage, setProgressNoImage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NO_IMAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Progress State for 16 Reading Passages
  const [progressReading, setProgressReading] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_READING_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Current IDs for each tab
  const [currentImageId, setCurrentImageId] = useState(1);
  const [currentNoImageId, setCurrentNoImageId] = useState(1);
  const [currentReadingId, setCurrentReadingId] = useState(1);

  // Filters for Image Tab
  const [imageLessonFilter, setImageLessonFilter] = useState('all');
  const [imageStatusFilter, setImageStatusFilter] = useState('all');
  const [imageSearchQuery, setImageSearchQuery] = useState('');

  // Filters for No-Image Tab
  const [noImageLessonFilter, setNoImageLessonFilter] = useState('all');
  const [noImageStatusFilter, setNoImageStatusFilter] = useState('all');
  const [noImageSearchQuery, setNoImageSearchQuery] = useState('');

  // Filters for Reading Tab
  const [readingGroupFilter, setReadingGroupFilter] = useState('all');
  const [readingStatusFilter, setReadingStatusFilter] = useState('all');
  const [readingSearchQuery, setReadingSearchQuery] = useState('');

  // Speech Controller
  const speech = useSpeech(speed);

  // Save Settings to localStorage
  useEffect(() => {
    localStorage.setItem(SPEED_KEY, String(speed));
  }, [speed]);

  useEffect(() => {
    localStorage.setItem(FURIGANA_KEY, JSON.stringify(showFurigana));
  }, [showFurigana]);

  useEffect(() => {
    localStorage.setItem(STORAGE_IMAGE_KEY, JSON.stringify(progressImage));
  }, [progressImage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NO_IMAGE_KEY, JSON.stringify(progressNoImage));
  }, [progressNoImage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_READING_KEY, JSON.stringify(progressReading));
  }, [progressReading]);

  // Update Status Handlers
  const handleUpdateImageStatus = useCallback((id, status) => {
    setProgressImage((prev) => {
      const updated = { ...prev };
      if (status === 'unseen') delete updated[id];
      else updated[id] = status;
      return updated;
    });
  }, []);

  const handleUpdateNoImageStatus = useCallback((id, status) => {
    setProgressNoImage((prev) => {
      const updated = { ...prev };
      if (status === 'unseen') delete updated[id];
      else updated[id] = status;
      return updated;
    });
  }, []);

  const handleUpdateReadingStatus = useCallback((id, status) => {
    setProgressReading((prev) => {
      const updated = { ...prev };
      if (status === 'unseen') delete updated[id];
      else updated[id] = status;
      return updated;
    });
  }, []);

  // Reset Handlers
  const handleResetImageProgress = useCallback(() => {
    setProgressImage({});
    localStorage.removeItem(STORAGE_IMAGE_KEY);
  }, []);

  const handleResetNoImageProgress = useCallback(() => {
    setProgressNoImage({});
    localStorage.removeItem(STORAGE_NO_IMAGE_KEY);
  }, []);

  const handleResetReadingProgress = useCallback(() => {
    setProgressReading({});
    localStorage.removeItem(STORAGE_READING_KEY);
  }, []);

  // Filtered List for Image Tab
  const filteredImageList = useMemo(() => {
    return imageQuestionsData.filter((q) => {
      if (imageLessonFilter !== 'all' && q.lesson !== Number(imageLessonFilter)) return false;
      const itemStatus = progressImage[q.id] || 'unseen';
      if (imageStatusFilter !== 'all' && itemStatus !== imageStatusFilter) return false;
      if (imageSearchQuery.trim()) {
        const query = imageSearchQuery.toLowerCase().trim();
        const idMatch = String(q.id) === query || `hình ${q.id}`.includes(query) || `hinh ${q.id}`.includes(query);
        const grammarMatch = q.grammar.toLowerCase().includes(query);
        return idMatch || grammarMatch;
      }
      return true;
    });
  }, [imageLessonFilter, imageStatusFilter, imageSearchQuery, progressImage]);

  // Filtered List for No-Image Tab
  const filteredNoImageList = useMemo(() => {
    return noImageQuestionsData.filter((q) => {
      if (noImageLessonFilter !== 'all' && q.lesson !== Number(noImageLessonFilter)) return false;
      const itemStatus = progressNoImage[q.id] || 'unseen';
      if (noImageStatusFilter !== 'all' && itemStatus !== noImageStatusFilter) return false;
      if (noImageSearchQuery.trim()) {
        const query = noImageSearchQuery.toLowerCase().trim();
        const idMatch = String(q.id) === query || `câu ${q.id}`.includes(query) || `cau ${q.id}`.includes(query);
        const grammarMatch = q.grammar.toLowerCase().includes(query) || q.grammar_meaning.toLowerCase().includes(query);
        const textMatch = q.q_jp.toLowerCase().includes(query) || q.q_vi.toLowerCase().includes(query);
        return idMatch || grammarMatch || textMatch;
      }
      return true;
    });
  }, [noImageLessonFilter, noImageStatusFilter, noImageSearchQuery, progressNoImage]);

  // Filtered List for Reading Tab
  const filteredReadingList = useMemo(() => {
    return readingPassagesData.filter((p) => {
      if (readingGroupFilter !== 'all' && p.group !== readingGroupFilter) return false;
      const itemStatus = progressReading[p.id] || 'unseen';
      if (readingStatusFilter !== 'all' && itemStatus !== readingStatusFilter) return false;
      if (readingSearchQuery.trim()) {
        const query = readingSearchQuery.toLowerCase().trim();
        const idMatch = String(p.id) === query || `bài ${p.id}`.includes(query) || `bai ${p.id}`.includes(query);
        const titleMatch = p.title.toLowerCase().includes(query);
        const textMatch = p.jp_text.toLowerCase().includes(query) || p.vi_text.toLowerCase().includes(query);
        return idMatch || titleMatch || textMatch;
      }
      return true;
    });
  }, [readingGroupFilter, readingStatusFilter, readingSearchQuery, progressReading]);

  // Current Objects
  const currentImageQuestion = useMemo(() => {
    return imageQuestionsData.find(q => q.id === currentImageId) || imageQuestionsData[0];
  }, [currentImageId]);

  const currentNoImageQuestion = useMemo(() => {
    return noImageQuestionsData.find(q => q.id === currentNoImageId) || noImageQuestionsData[0];
  }, [currentNoImageId]);

  const currentReadingPassage = useMemo(() => {
    return readingPassagesData.find(p => p.id === currentReadingId) || readingPassagesData[0];
  }, [currentReadingId]);

  // Navigation for Image Tab
  const handlePrevImage = useCallback(() => {
    const list = filteredImageList.length > 0 ? filteredImageList : imageQuestionsData;
    const idx = list.findIndex(q => q.id === currentImageId);
    if (idx > 0) setCurrentImageId(list[idx - 1].id);
    else setCurrentImageId(list[list.length - 1].id);
  }, [currentImageId, filteredImageList]);

  const handleNextImage = useCallback(() => {
    const list = filteredImageList.length > 0 ? filteredImageList : imageQuestionsData;
    const idx = list.findIndex(q => q.id === currentImageId);
    if (idx !== -1 && idx < list.length - 1) setCurrentImageId(list[idx + 1].id);
    else setCurrentImageId(list[0].id);
  }, [currentImageId, filteredImageList]);

  const handleRandomImage = useCallback(() => {
    const list = filteredImageList.length > 0 ? filteredImageList : imageQuestionsData;
    const randomIdx = Math.floor(Math.random() * list.length);
    setCurrentImageId(list[randomIdx].id);
  }, [filteredImageList]);

  // Navigation for No-Image Tab
  const handlePrevNoImage = useCallback(() => {
    const list = filteredNoImageList.length > 0 ? filteredNoImageList : noImageQuestionsData;
    const idx = list.findIndex(q => q.id === currentNoImageId);
    if (idx > 0) setCurrentNoImageId(list[idx - 1].id);
    else setCurrentNoImageId(list[list.length - 1].id);
  }, [currentNoImageId, filteredNoImageList]);

  const handleNextNoImage = useCallback(() => {
    const list = filteredNoImageList.length > 0 ? filteredNoImageList : noImageQuestionsData;
    const idx = list.findIndex(q => q.id === currentNoImageId);
    if (idx !== -1 && idx < list.length - 1) setCurrentNoImageId(list[idx + 1].id);
    else setCurrentNoImageId(list[0].id);
  }, [currentNoImageId, filteredNoImageList]);

  const handleRandomNoImage = useCallback(() => {
    const list = filteredNoImageList.length > 0 ? filteredNoImageList : noImageQuestionsData;
    const randomIdx = Math.floor(Math.random() * list.length);
    setCurrentNoImageId(list[randomIdx].id);
  }, [filteredNoImageList]);

  // Navigation for Reading Tab
  const handlePrevReading = useCallback(() => {
    const list = filteredReadingList.length > 0 ? filteredReadingList : readingPassagesData;
    const idx = list.findIndex(p => p.id === currentReadingId);
    if (idx > 0) setCurrentReadingId(list[idx - 1].id);
    else setCurrentReadingId(list[list.length - 1].id);
  }, [currentReadingId, filteredReadingList]);

  const handleNextReading = useCallback(() => {
    const list = filteredReadingList.length > 0 ? filteredReadingList : readingPassagesData;
    const idx = list.findIndex(p => p.id === currentReadingId);
    if (idx !== -1 && idx < list.length - 1) setCurrentReadingId(list[idx + 1].id);
    else setCurrentReadingId(list[0].id);
  }, [currentReadingId, filteredReadingList]);

  const handleRandomReading = useCallback(() => {
    const list = filteredReadingList.length > 0 ? filteredReadingList : readingPassagesData;
    const randomIdx = Math.floor(Math.random() * list.length);
    setCurrentReadingId(list[randomIdx].id);
  }, [filteredReadingList]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeTab === 'image') handlePrevImage();
        else if (activeTab === 'no-image') handlePrevNoImage();
        else if (activeTab === 'reading') handlePrevReading();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeTab === 'image') handleNextImage();
        else if (activeTab === 'no-image') handleNextNoImage();
        else if (activeTab === 'reading') handleNextReading();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (activeTab === 'image') {
          const allText = currentImageQuestion.qa.map(item => item.q_jp).join(' ... ');
          speech.speak(allText, speed);
        } else if (activeTab === 'no-image') {
          speech.speak(currentNoImageQuestion.q_jp, speed);
        } else if (activeTab === 'reading') {
          speech.speak(currentReadingPassage.jp_text, speed);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handlePrevImage, handleNextImage, handlePrevNoImage, handleNextNoImage, handlePrevReading, handleNextReading, currentImageQuestion, currentNoImageQuestion, currentReadingPassage, speed, speech]);

  // Statistics depending on current active tab
  const currentStats = useMemo(() => {
    if (activeTab === 'reading') {
      const mastered = Object.values(progressReading).filter(v => v === 'mastered').length;
      const review = Object.values(progressReading).filter(v => v === 'review').length;
      return { mastered, review, total: readingPassagesData.length };
    }
    if (activeTab === 'no-image') {
      const mastered = Object.values(progressNoImage).filter(v => v === 'mastered').length;
      const review = Object.values(progressNoImage).filter(v => v === 'review').length;
      return { mastered, review, total: noImageQuestionsData.length };
    }
    // Default: Image tab
    const mastered = Object.values(progressImage).filter(v => v === 'mastered').length;
    const review = Object.values(progressImage).filter(v => v === 'review').length;
    return { mastered, review, total: imageQuestionsData.length };
  }, [activeTab, progressImage, progressNoImage, progressReading]);

  // Điều khiển toggle sidebar / drawer phù hợp theo từng tab
  const handleToggleSidebar = useCallback(() => {
    if (activeTab === 'vocabulary' || activeTab === 'ai-lookup') {
      setIsGeneralDrawerOpen(prev => !prev);
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        speed={speed}
        setSpeed={setSpeed}
        showFurigana={showFurigana}
        setShowFurigana={setShowFurigana}
        toggleSidebar={handleToggleSidebar}
        isSidebarOpen={
          (activeTab === 'vocabulary' || activeTab === 'ai-lookup')
            ? isGeneralDrawerOpen
            : isSidebarOpen
        }
        masteredCount={currentStats.mastered}
        reviewCount={currentStats.review}
        totalCount={currentStats.total}
        onOpenMockTest={() => setActiveTab('mocktest')}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        
        {/* Left Sidebar according to active tab */}
        {activeTab === 'image' && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            questions={imageQuestionsData}
            currentId={currentImageId}
            onSelectQuestion={(id) => setCurrentImageId(id)}
            lessonFilter={imageLessonFilter}
            setLessonFilter={setImageLessonFilter}
            statusFilter={imageStatusFilter}
            setStatusFilter={setImageStatusFilter}
            searchQuery={imageSearchQuery}
            setSearchQuery={setImageSearchQuery}
            progress={progressImage}
            onResetProgress={handleResetImageProgress}
          />
        )}

        {activeTab === 'no-image' && (
          <NoImageSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            questions={noImageQuestionsData}
            currentId={currentNoImageId}
            onSelectQuestion={(id) => setCurrentNoImageId(id)}
            lessonFilter={noImageLessonFilter}
            setLessonFilter={setNoImageLessonFilter}
            statusFilter={noImageStatusFilter}
            setStatusFilter={setNoImageStatusFilter}
            searchQuery={noImageSearchQuery}
            setSearchQuery={setNoImageSearchQuery}
            progress={progressNoImage}
            onResetProgress={handleResetNoImageProgress}
          />
        )}

        {activeTab === 'reading' && (
          <ReadingSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            passages={readingPassagesData}
            currentId={currentReadingId}
            onSelectPassage={(id) => setCurrentReadingId(id)}
            groupFilter={readingGroupFilter}
            setGroupFilter={setReadingGroupFilter}
            statusFilter={readingStatusFilter}
            setStatusFilter={setReadingStatusFilter}
            searchQuery={readingSearchQuery}
            setSearchQuery={setReadingSearchQuery}
            progress={progressReading}
            onResetProgress={handleResetReadingProgress}
          />
        )}

        {/* General Navigation Drawer for Vocabulary and AI Lookup tabs */}
        {(activeTab === 'vocabulary' || activeTab === 'ai-lookup') && (
          <GeneralDrawer
            isOpen={isGeneralDrawerOpen}
            onClose={() => setIsGeneralDrawerOpen(false)}
            activeTab={activeTab}
            onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          />
        )}

        {/* Center Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'image' && (
            <PracticeCard
              question={currentImageQuestion}
              totalCount={imageQuestionsData.length}
              onPrev={handlePrevImage}
              onNext={handleNextImage}
              onRandom={handleRandomImage}
              onStatusChange={handleUpdateImageStatus}
              status={progressImage[currentImageQuestion.id] || 'unseen'}
              showFurigana={showFurigana}
              speech={speech}
              speed={speed}
              setSpeed={setSpeed}
            />
          )}

          {activeTab === 'no-image' && (
            <NoImagePracticeCard
              question={currentNoImageQuestion}
              totalCount={noImageQuestionsData.length}
              onPrev={handlePrevNoImage}
              onNext={handleNextNoImage}
              onRandom={handleRandomNoImage}
              onStatusChange={handleUpdateNoImageStatus}
              status={progressNoImage[currentNoImageQuestion.id] || 'unseen'}
              showFurigana={showFurigana}
              speech={speech}
              speed={speed}
              setSpeed={setSpeed}
            />
          )}

          {activeTab === 'reading' && (
            <ReadingPracticeCard
              passage={currentReadingPassage}
              totalCount={readingPassagesData.length}
              onPrev={handlePrevReading}
              onNext={handleNextReading}
              onRandom={handleRandomReading}
              onStatusChange={handleUpdateReadingStatus}
              status={progressReading[currentReadingPassage.id] || 'unseen'}
              showFurigana={showFurigana}
              setShowFurigana={setShowFurigana}
              speech={speech}
              speed={speed}
              setSpeed={setSpeed}
              onOpenAiSettings={() => setIsAiSettingsOpen(true)}
            />
          )}

          {activeTab === 'vocabulary' && (
            <VocabPractice
              showFurigana={showFurigana}
              speech={speech}
              speed={speed}
              setSpeed={setSpeed}
            />
          )}

          {activeTab === 'ai-lookup' && (
            <AiLookupView
              speech={speech}
              speed={speed}
              onOpenAiSettings={() => setIsAiSettingsOpen(true)}
            />
          )}

          {activeTab === 'mocktest' && (
            <MockTestModal
              imageQuestions={imageQuestionsData}
              noImageQuestions={noImageQuestionsData}
              readingPassages={readingPassagesData}
              onClose={() => setActiveTab('image')}
              speech={speech}
              speed={speed}
              setSpeed={setSpeed}
              showFurigana={showFurigana}
              onUpdateImageStatus={handleUpdateImageStatus}
              onUpdateNoImageStatus={handleUpdateNoImageStatus}
              onUpdateReadingStatus={handleUpdateReadingStatus}
            />
          )}
        </main>

      </div>

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </div>
  );
}
