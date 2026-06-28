const deps = ['@babel/core', '@babel/plugin-transform-react-jsx-self', '@babel/plugin-transform-react-jsx-source', 'react-refresh'];
for (const dep of deps) {
  console.log(`Importing: ${dep}`);
  try {
    const mod = await import(dep);
    console.log(`Success: ${dep}`);
  } catch (e) {
    console.log(`Failed: ${dep} - ${e.message}`);
  }
}
