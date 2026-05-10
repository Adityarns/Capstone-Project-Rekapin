import server from "./src/server.js/index.js";

const host = process.env.HOST;
const port = process.env.PORT;

server.listen(port, () => {
  console.log(`Server berjalan di http://${host}:${port}`);
});
