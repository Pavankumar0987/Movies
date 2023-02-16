const express = require("express");
const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
    directorName: dbObject.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const moviesList = `
        SELECT movie_name FROM movie ORDER BY movie_id
    `;
  const movieArray = await db.all(moviesList);
  response.send(
    movieArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieDetails = `
    INSERT INTO 
       movie (director_id, movie_name, lead_actor)
    VALUES 
    (
       ${directorId},
       '${movieName}',
       '${leadActor}'
    )`;
  const dbResponse = await db.run(addMovieDetails);
  const dbresponse = convertDbObjectToResponseObject(dbResponse);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetails = `
       SELECT * FROM movie WHERE movie_id = ${movieId}
    `;
  const movie = await db.get(getMovieDetails);
  response.send(convertDbObjectToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovie = `
        UPDATE
           movie
        SET
           director_id = ${directorId},
           movie_name = '${movieName}',
           lead_actor = '${leadActor}'
        WHERE
           movie_id = ${movieId}
    `;
  const dbResponse = await db.run(updateMovie);
  const dbresponse = convertDbObjectToResponseObject(dbResponse);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
        DELETE FROM movie WHERE movie_id = ${movieId}
    `;
  const dbResponse = await db.run(deleteMovie);

  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const directorList = `
        SELECT * FROM director ORDER BY director_id
    `;
  const directorArray = await db.all(directorList);
  response.send(
    directorArray.map((eachDirector) =>
      convertDbObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const moviesList = `
        SELECT movie_name
        FROM movie 
        WHERE 
            director_id = ${directorId}
        ORDER BY movie_id
    `;
  const movieArray = await db.all(moviesList);
  const newMovies = movieArray.map((eachMovie) =>
    convertDbObjectToResponseObject(eachMovie)
  );
  response.send(newMovies);
});

module.exports = app;
