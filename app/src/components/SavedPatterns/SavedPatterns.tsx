import React, { useEffect, useState } from 'react';
import { UserPatternData } from '../../models/user-pattern-data';
import { UserPatternService } from '../../services/firestore-service';
import { DomManager } from '../../services/dom_manager';
import { firebaseApp } from '../../firebase/firebase-config';
import { PatternType } from '../../models/pattern-type';
import { useNavigation } from '../../components/AppRouter';
import './SavedPatterns.css';

interface SavedPattern {
  patternData: UserPatternData;
  originalCreatedAt?: string;
}

const SavedPatterns: React.FC = () => {
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWebsite, setCurrentWebsite] = useState<string>('');
  const { navigateTo } = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSavedPatterns();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        loadSavedPatterns();
      }, 100);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadSavedPatterns = async () => {
    try {
      setIsLoading(true);

      await new Promise((resolve) => {
        const unsubscribe = firebaseApp.auth().onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      });
      
      const user = firebaseApp.auth().currentUser;
      console.log('Current user in loadSavedPatterns:', user?.uid);
      
      if (!user) {
        console.log('No user logged in');
        setSavedPatterns([]);
        setIsLoading(false);
        return;
      }

      const domManager = new DomManager();
      const websiteUrl = await domManager.getWebsiteURL();
      console.log('Current website URL:', websiteUrl);
      setCurrentWebsite(websiteUrl);

      const patternService = new UserPatternService();
      console.log('Querying patterns for user:', user.uid, 'website:', websiteUrl);
      
      const patterns = await patternService.getUserPatternDataByUUIDAndURL(
        user.uid,
        websiteUrl
      );

      console.log('Retrieved patterns:', patterns);

      const savedPatternsList: SavedPattern[] = patterns.map(pattern => ({
        patternData: pattern,
        originalCreatedAt: pattern.createdAt
      }));

      console.log('Final saved patterns list:', savedPatternsList);
      setSavedPatterns(savedPatternsList);
      
    } catch (error) {
      console.error('Error loading saved patterns:', error);
      setSavedPatterns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillPassword = (pattern: SavedPattern) => {
    const patternType = pattern.patternData.pattern_type;
    const username = pattern.patternData.username;
    
    switch (patternType) {
      case PatternType.CONNECT_DOTS:
        navigateTo('connect_the_dots', { 
          isCreatingPassword: false,
          username: username
        });
        break;
      default:
        console.warn('Unknown pattern type:', patternType);
        navigateTo('connect_the_dots', { 
          isCreatingPassword: false,
          username: username
        });
    }
  };

  const getPatternTypeDisplay = (type: PatternType) => {
    switch (type) {
      case PatternType.CONNECT_DOTS:
        return { icon: '⚫', name: 'Connect The Dots' };
      default:
        return { icon: '🔐', name: 'Pattern' };
    }
  };

  if (isLoading) {
    return (
      <div className="saved-patterns-container">
        <div className="loading">Loading saved patterns...</div>
      </div>
    );
  }

  if (savedPatterns.length === 0) {
    return (
      <div className="saved-patterns-container">
        <div className="no-patterns">
          <p>No saved patterns for {currentWebsite}</p>
          <p className="hint">Create a new pattern to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-patterns-container">
      <div className="patterns-header">
        <h3>Saved Patterns for {currentWebsite}</h3>
        <button onClick={loadSavedPatterns} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="patterns-list">
        {savedPatterns.map((pattern) => {
          const patternType = getPatternTypeDisplay(pattern.patternData.pattern_type);
          
          return (
            <div key={pattern.patternData.uuid} className="pattern-item">
              <div className="pattern-info">
                <div className="pattern-type">
                  <span className="pattern-icon">{patternType.icon}</span>
                  <span className="pattern-name">{patternType.name}</span>
                </div>
                <div className="pattern-username">
                  Username: {pattern.patternData.username || 'No username'}
                </div>
              </div>
              
              <div className="pattern-actions">
                <button
                  onClick={() => handleFillPassword(pattern)}
                  className="fill-password-button"
                  title="Draw pattern to fill password"
                >
                  🔓 Unlock & Fill
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedPatterns;