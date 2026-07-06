console.log('--- ENV VARS ---');
for (const key of Object.keys(process.env)) {
  if (key.includes('SUPABASE') || key.includes('POSTGRES') || key.includes('DB') || key.includes('PASSWORD')) {
    console.log(`${key}: ${process.env[key]}`);
  }
}
