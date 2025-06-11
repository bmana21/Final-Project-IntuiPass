import { PatternType } from './pattern-type';

export class UserPatternData {
  uuid: string;
  user_uuid: string;
  username: string;
  pattern_type: PatternType;
  website_url: string;
  password_encrypted: string;
  createdAt: string;

  constructor(
    user_uuid: string,
    pattern_type: PatternType,
    username: string,
    website_url: string,
    password_encrypted: string,
  ) {
    this.uuid = crypto.randomUUID();
    this.user_uuid = user_uuid;
    this.pattern_type = pattern_type;
    this.website_url = website_url;
    this.username = username;
    this.password_encrypted = password_encrypted;
    this.createdAt = new Date().toISOString();
  }

  toFirestore() {
    return {
      uuid: this.uuid,
      user_uuid: this.user_uuid,
      pattern_type: this.pattern_type,
      website_url: this.website_url,
      username: this.username,
      password_encrypted: this.password_encrypted,
      createdAt: this.createdAt
    };
  }

  static fromFirestore(snapshot: { data: () => any }): UserPatternData {
    const data = snapshot.data();
    return new UserPatternData(
      data.user_uuid,
      data.pattern_type,
      data.username,
      data.website_url,
      data.password_encrypted
    );
  }
}
