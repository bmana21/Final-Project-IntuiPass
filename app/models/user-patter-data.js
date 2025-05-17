class UserPatternData {
  constructor(user_uuid, pattern_type, website_url, password_enctrypted, salt, randomChars) {
    this.uuid = crypto.randomUUID();
    this.user_uuid = user_uuid;
    this.pattern_type = pattern_type;
    this.website_url = website_url;
    this.salt = salt;
    this.randomChars = randomChars;
    this.password_enctrypted = password_enctrypted;
    this.createdAt = new Date().toISOString();
  }

  toFirestore() {
    return {
      uuid: this.uuid,
      user_uuid: this.user_uuid,
      pattern_type: this.pattern_type,
      website_url: this.website_url,
      password_enctrypted: this.password_enctrypted,
      salt: this.salt,
      randomChars: this.randomChars,
      createdAt: this.createdAt
    };
  }

  static fromFirestore(snapshot) {
    const data = snapshot.data();
    return new UserPatternData(
      data.uuid,
      data.user_uuid,
      data.pattern_type,
      data.website_url,
      data.password_enctrypted,
      data.salt,
      data.randomChars,
      data.createdAt
    );
  }
}