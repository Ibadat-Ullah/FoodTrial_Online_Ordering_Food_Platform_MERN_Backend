import app from "./server.js";

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
