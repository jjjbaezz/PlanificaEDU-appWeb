import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: '',
  password: '',
  database: '',
  port: 5432,
});

export const connectDB = async () => {

};

export { pool };
