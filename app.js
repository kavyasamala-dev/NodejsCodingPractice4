const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

connection();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//GET States API

app.get("/states/", async (request, response) => {
  const stateQuery = `SELECT * FROM state
    ORDER BY state_id;`;
  const stateDetails = await db.all(stateQuery);
  response.send(
    stateDetails.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

// GET state with ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateGet = `SELECT * FROM state
    WHERE state_id = ${stateId};`;

  const state = await db.get(stateGet);
  response.send(convertDbObjectToResponseObject(state));
});

// POST A District

app.post("/districts/", async (request, response) => {
  const districtDetailsIs = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetailsIs;
  const postingDistrict = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});`;

  const newDistrict = await db.run(postingDistrict);
  response.send("District Successfully Added");
});

// GET District with ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtGet = `SELECT * FROM district
    WHERE district_id = ${districtId};`;

  const districtIs = await db.get(districtGet);
  response.send(districtIs);
});

// DELETE District

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM District
    WHERE district_id = ${districtId};`;

  await db.run(deleteDistrict);
  response.send("District Removed");
});

//UPDATE District

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = updateDistrict;
  const updateQuery = `
    UPDATE district SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE district_id = ${districtId};`;

  await db.run(updateQuery);

  response.send("District Details Updated");
});

//Get state with ID
app.get("/states/:stateId/stats/", async (request, response) => {});

module.exports = app;
