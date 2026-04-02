import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local so EXPO_PUBLIC_* variables are available in tests
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
