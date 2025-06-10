import React, { useEffect, useState } from 'react';
import { UserPatternData } from '../../models/user-pattern-data';
import { UserPatternService } from '../../services/firestore-service';
import { DomManager } from '../../services/dom_manager';
import { firebaseApp } from '../../firebase/firebase-config';
import { PatternType } from '../../models/pattern-type';
import PatternVerification from '../PatternVerification/PatternVerification';
import './SavedPatterns.css';

interface SavedPattern {
  patternData: UserPatternData;
  originalCreatedAt?: string; // Store the original creation date
}

const SavedPatterns: React.FC = () => {
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWebsite, setCurrentWebsite] = useState<string>('');
  const [showVerification, setShowVerification] = useState(false);
  const [patternToVerify, setPatternToVerify] = useState<UserPatternData | null>(null);

  useEffect(() => {
    loadSavedPatterns();
  }, []);

  const loadSavedPatterns = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const user = firebaseApp.auth().currentUser;
      if (!user) {
        console.log('No user logged in');
        setIsLoading(false);
        return;
      }

      // Get current website URL
      const domManager = new DomManager();
      const websiteUrl = await domManager.getWebsiteURL();
      setCurrentWebsite(websiteUrl);

      console.log('Loading patterns for:', { userId: user.uid, websiteUrl });

      // Since direct Firestore access fails due to permissions,
      // we'll create a custom method to get raw data through the service
      const patternService = new UserPatternService();
      
      // Get raw Firestore data by creating a custom query method
      try {
        const db = firebaseApp.firestore();
        console.log('Attempting custom Firestore query through service...');
        
        // Create a more permissive query
        const collection = db.collection('user_pattern_data');
        const query = collection
          .where('user_uuid', '==', user.uid)
          .where('website_url', '==', websiteUrl);
        
        const querySnapshot = await query.get();
        console.log('Custom query returned', querySnapshot.size, 'documents');

        const savedPatternsList: SavedPattern[] = [];
        
        querySnapshot.forEach((doc) => {
          const rawData = doc.data();
          console.log('Raw document data:', rawData);
          
          // Create UserPatternData manually without using constructor
          const pattern = Object.create(UserPatternData.prototype);
          pattern.uuid = rawData.uuid;
          pattern.user_uuid = rawData.user_uuid;
          pattern.pattern_type = rawData.pattern_type;
          pattern.website_url = rawData.website_url;
          pattern.password_encrypted = rawData.password_encrypted;
          pattern.createdAt = rawData.createdAt; // Keep original creation time!
          
          console.log('Pattern with preserved createdAt:', {
            uuid: pattern.uuid,
            createdAt: pattern.createdAt
          });
          
          savedPatternsList.push({
            patternData: pattern,
            originalCreatedAt: rawData.createdAt
          });
        });

        console.log('Final patterns with preserved dates:', savedPatternsList);
        setSavedPatterns(savedPatternsList);
        
      } catch (customError) {
        console.warn('Custom Firestore query failed, using service method:', customError);
        
        // Final fallback - at least try to get the patterns even with wrong dates
        const patterns = await patternService.getUserPatternDataByUUIDAndURL(
          user.uid,
          websiteUrl
        );

        console.log('Service method patterns (will have current time):', patterns);

        const savedPatternsList: SavedPattern[] = patterns.map(pattern => ({
          patternData: pattern,
          originalCreatedAt: pattern.createdAt // Will be current time due to fromFirestore bug
        }));

        setSavedPatterns(savedPatternsList);
      }
      
    } catch (error) {
      console.error('Error loading saved patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillPassword = async (pattern: SavedPattern) => {
    // Show the pattern verification modal
    setPatternToVerify(pattern.patternData);
    setShowVerification(true);
  };

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    setPatternToVerify(null);
    // Password has been filled automatically by the verification component
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setPatternToVerify(null);
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
      
      {showVerification && patternToVerify && (
        <PatternVerification
          patternData={patternToVerify}
          onSuccess={handleVerificationSuccess}
          onCancel={handleVerificationCancel}
        />
      )}
    </div>
  );
};

export default SavedPatterns;