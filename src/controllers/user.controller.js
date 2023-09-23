const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    //TODO: Implement this API

    // Defining pagination page, limit and skip
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Defining pipeling for aggregation
    const pipeline = [
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "userPosts",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          posts: {
            $size: "$userPosts",
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const countQuery = User.countDocuments();

    // Calling Aggregation
    Promise.all([User.aggregate(pipeline), countQuery])
      .then(([result, totalDocs]) => {
        const totalPages = Math.ceil(totalDocs / limit);
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;
        const pagingCounter = (page - 1) * limit + 1;

        const paginationData = {
          totalDocs,
          limit,
          page,
          totalPages,
          pagingCounter,
          hasPrevPage,
          hasNextPage,
          prevPage: hasPrevPage ? page - 1 : null,
          nextPage: hasNextPage ? page + 1 : null,
        };

        // Defining Response
        const response = {
          data: { users: result, pagination: paginationData },
        };
        res.status(200).json(response);
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    res.send({ error: error.message });
  }
};
