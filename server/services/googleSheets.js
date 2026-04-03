const { google } = require('googleapis');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    const keyPath = path.join(__dirname, '../config/google-key.json');

    this.auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });

    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Form Responses 1';
  }

  // 🔹 FETCH DATA FROM GOOGLE SHEET
  async fetchPlayers() {
    try {
      const range = `'${this.sheetName}'!A:E`;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        console.log('No data found in Google Sheets');
        return [];
      }

      console.log('Raw sheet data:', rows);

      // 🔹 Skip header and map correctly
      const players = rows.slice(1).map((row, index) => ({
        name: row[1] || `Player ${index + 1}`,       // Name
        college_id: row[0] || '',                       // College ID (Column A)
        year: row[2] || '1st',                       // Year
        role: (row[3] || 'batsman').toLowerCase(),   // Role
        is_mvp: row[4]?.toLowerCase() === 'yes',     // Boolean conversion
        base_price: 10
      }));

      console.log(`Processed ${players.length} players`);
      return players;

    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      throw error;
    }
  }

  // 🔹 SYNC TO SUPABASE
  async syncToSupabase(supabase) {
    try {
      const players = await this.fetchPlayers();

      let syncedCount = 0;

      for (const player of players) {

        // 🔹 CHECK DUPLICATE (name + college_id)
        const { data: existingPlayer, error } = await supabase
          .from('players')
          .select('id')
          .eq('name', player.name)
          .eq('college_id', player.college_id)
          .maybeSingle();

        if (error) {
          console.error('Error checking existing player:', error);
          continue;
        }

        if (!existingPlayer) {
          // 🔹 INSERT NEW PLAYER
          const { error: insertError } = await supabase
            .from('players')
            .insert({
              name: player.name,
              college_id: player.college_id,
              year: player.year,
              role: player.role,
              is_mvp: player.is_mvp,
              base_price: player.base_price,
              status: 'available',
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error inserting player:', insertError);
          } else {
            console.log(`✅ Added player: ${player.name}`);
            syncedCount++;
          }

        } else {
          console.log(`⚠️ Player already exists: ${player.name}`);
        }
      }

      return {
        synced: syncedCount,
        total: players.length
      };

    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      throw error;
    }
  }

  // 🔹 TEST CONNECTION
  async testConnection() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      console.log('✅ Connected to Google Sheets');
      console.log('Sheet name:', response.data.properties.title);

      return true;
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error);
      return false;
    }
  }
}

module.exports = GoogleSheetsService;