require("dotenv").config();

const Pool = require("pg").Pool;
const pool = new Pool({
  user: `${process.env.PGUSERNAME}`,
  database: `${process.env.DATABASE_URL}`,
  password: `${process.env.PGPASSWORD}`,
  port: process.env.PGPORT,
});

const getAddress = async function (user_id) {
  let query_1 = {
    text: "select address_id from quatro_address where user_id=$1",
    values: [user_id],
  };

  let resultQuery_1 = await pool.query(query_1);
  let address = resultQuery_1.rows;

  if (address.length === 0) {
    throw Error("Address doesn't exist");
  }

  let query = {
    text: "select address_line_1, address_line_2, address_line_3, postcode, state from quatro_address where user_id = $1 order by address_id asc",
    values: [user_id],
  };

  let resultQuery = await pool.query(query);

  let getAddressUser = resultQuery.rows;
  return getAddressUser;
};

const getAddressAPI = async (request, response) => {
  const { user_id } = request.body;
  try {
    let searchAddressUser = await getAddress(request.query.user_id);
    response.status(200).json({ result: searchAddressUser });
  } catch (error) {
    response.status(404).json({ error: error.message });
  }
};

const createAddress = async function (
  address_line_1,
  address_line_2,
  address_line_3,
  postcode,
  state,
  user_id
) {
  let existQuery = {
    text: "select address_line_1, address_line_2, address_line_3, postcode, state, user_id from quatro_address where address_line_1=$1 and address_line_2=$2 and address_line_3=$3 and postcode =$4 and state =$5 and user_id=$6",
    values: [
      address_line_1,
      address_line_2,
      address_line_3,
      postcode,
      state,
      user_id,
    ],
  };
  let resultExistQuery = await pool.query(existQuery);
  let existAddress = resultExistQuery.rows;

  var regAddress = /^[a-zA-Z0-9.-\s]/;
  var regPostcode = /^\d{5}$/;
  const states = [
    "WP Kuala Lumpur",
    "Kuala Lumpur",
    "Johor",
    "Kedah",
    "Kelantan",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Penang",
    "Perak",
    "Perlis",
    "Sabah",
    "Sarawak",
    "Selangor",
    "Terengganu",
    "WP Labuan",
    "Labuan",
    "WP Putrajaya",
    "Putrajaya",
  ];
  const upperStates = states.map((e) => {
    return e.toUpperCase();
  });

  if (
    !address_line_1.trim() ||
    !address_line_2.trim() ||
    !postcode.trim() ||
    !state.trim()
  ) {
    throw Error(
      "At least require input for address line 1 , address line 2,  postcode and state"
    );
  }

  if (address_line_1) {
    if (!regAddress.test(address_line_1)) {
      throw Error("*Address line 1 not in correct format");
    }
  }

  if (address_line_2) {
    if (!regAddress.test(address_line_2)) {
      throw Error("*Address line 2 not in correct format");
    }
  }

  if (address_line_3) {
    if (!regAddress.test(address_line_3)) {
      throw Error("*Address line 3 not in correct format");
    }
  }

  if (postcode) {
    if (postcode.length != 5) {
      throw Error("*Postcode accepts 5 digits only");
    }
    if (!regPostcode.test(postcode)) {
      throw Error("*Postcode accepts digits only");
    }
  }

  if (state) {
    state = state.toUpperCase();
    if (!upperStates.includes(state)) {
      throw Error("*State's input is invalid");
    }
  }

  if (existAddress.length !== 0) {
    throw Error("Address already exists in database");
  }
  let query = {
    text: "insert into quatro_address(address_line_1, address_line_2, address_line_3, postcode, state, user_id) values($1,$2,$3,$4,$5,$6) returning address_id",
    values: [
      address_line_1,
      address_line_2,
      address_line_3,
      postcode,
      state,
      user_id,
    ],
  };

  let resultQuery = await pool.query(query);
  let newAddress = resultQuery.rows;
  return newAddress;
};

const createAddressAPI = async (request, response) => {
  const {
    address_line_1,
    address_line_2,
    address_line_3,
    postcode,
    state,
    user_id,
  } = request.body;
  try {
    let newAddress = await createAddress(
      address_line_1,
      address_line_2,
      address_line_3,
      postcode,
      state,
      user_id
    );
    response
      .status(200)
      .json({ result: newAddress, message: "Address added successfully" });
  } catch (error) {
    console.log("error:", error);
    response.status(404).json({ error: error.message });
  }
};

const updateAddressDetails = async function (
  address_line_1,
  address_line_2,
  address_line_3,
  postcode,
  state,
  address_id
) {
  let query_1 = {
    text: "select * from quatro_address where address_id=$1",
    values: [address_id],
  };

  let resultQuery_1 = await pool.query(query_1);
  let address = resultQuery_1.rows;

  if (address.length === 0) {
    throw Error("Address doesn't exist");
  }

  let query = {
    text: `update quatro_address set address_line_1 = coalesce(nullif($1,''), address_line_1),
           address_line_2 = coalesce(nullif($2,''), address_line_2),
           address_line_3 = coalesce(nullif($3,''), address_line_3),
           postcode = coalesce(nullif($4,''), postcode),
           state = coalesce(nullif($5,''), state)
           where address_id = $6;`,
    values: [
      address_line_1,
      address_line_2,
      address_line_3,
      postcode,
      state,
      address_id,
    ],
  };

  let resultQuery = await pool.query(query);
  let updateAddressDetailsDB = resultQuery.rows;
  return updateAddressDetailsDB;
};

const updateAddressDetailsAPI = async (request, response) => {
  const {
    address_line_1,
    address_line_2,
    address_line_3,
    postcode,
    state,
    address_id,
  } = request.body;

  try {
    let updateAddressDetailsDB = await updateAddressDetails(
      address_line_1,
      address_line_2,
      address_line_3,
      postcode,
      state,
      address_id
    );

    response
      .status(200)
      .json({ result: updateAddressDetailsDB, message: "Address updated" });
  } catch (error) {
    console.log("error:", error);
    response.status(404).json({ error: error.message });
  }
};

const deleteAddress = async function (address_id) {
  let query_1 = {
    text: "select address_id from quatro_address where address_id=$1",
    values: [address_id],
  };

  let resultQuery_1 = await pool.query(query_1);
  let address1 = resultQuery_1.rows;

  if (address1.length === 0) {
    throw Error("Address doesn't exist");
  }
  let query = {
    text: "delete from quatro_address where address_id = $1",
    values: [address_id],
  };

  let resultQuery = await pool.query(query);
  let addressDelete = resultQuery.rows;
  return addressDelete;
};

const deleteAddressAPI = async (request, response) => {
  const { address_id } = request.body;
  try {
    let addressDelete = await deleteAddress(address_id);
    response
      .status(200)
      .json({ result: addressDelete, message: "Address deleted" });
  } catch (error) {
    console.log("error:", error);
    response.status(404).json({ error: error.message });
  }
};

const setDefaultAddress = async function (address_id) {
  let query_1 = {
    text: "select address_id from quatro_address where address_id=$1",
    values: [address_id],
  };

  let resultQuery_1 = await pool.query(query_1);
  let address1 = resultQuery_1.rows;

  if (address1.length === 0) {
    throw Error("Address doesn't exist");
  }
  let query = {
    text: "update quatro_address set default_address = true where address_id=$1",
    values: [address_id],
  };

  let resultQuery = await pool.query(query);
  let addressDefault = resultQuery.rows;
  return addressDefault;
};

const setDefaultAddressAPI = async (request, response) => {
  const { address_id } = request.body;
  try {
    let addressDefault = await setDefaultAddress(address_id);
    response
      .status(200)
      .json({ result: addressDefault, message: "Address set to default" });
  } catch (error) {
    console.log("error:", error);
    response.status(404).json({ error: error.message });
  }
};

const undefaultAddress = async function (address_id) {
  let query_1 = {
    text: "select address_id from quatro_address where address_id=$1",
    values: [address_id],
  };

  let resultQuery_1 = await pool.query(query_1);
  let address1 = resultQuery_1.rows;

  if (address1.length === 0) {
    throw Error("Address doesn't exist");
  }
  let query = {
    text: "update quatro_address set default_address = false where address_id=$1",
    values: [address_id],
  };

  let resultQuery = await pool.query(query);
  let addressUndefault = resultQuery.rows;
  return addressUndefault;
};

const undefaultAddressAPI = async (request, response) => {
  const { address_id } = request.body;
  try {
    let addressUndefault = await undefaultAddress(address_id);
    response.status(200).json({
      result: addressUndefault,
      message: "Address set to not default",
    });
  } catch (error) {
    console.log("error:", error);
    response.status(404).json({ error: error.message });
  }
};

module.exports = {
  getAddressAPI,
  createAddressAPI,
  updateAddressDetailsAPI,
  deleteAddressAPI,
  setDefaultAddressAPI,
  undefaultAddressAPI,
};
