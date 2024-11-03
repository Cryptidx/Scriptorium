import prisma from './prisma'; // Import your Prisma client

/**
 * Paginate any Prisma model with specified options.
 * 
 * @param {string} modelName - The name of the Prisma model to paginate.
 * @param {number} page - The current page number (default is 1).
 * @param {number} pageSize - The number of records per page (default is 10).
 * @param {object} options - Additional Prisma query options (e.g., filtering, ordering).
 * @returns {object} - An object containing paginated data and metadata.
 */
async function paginate(modelName, page = 1, pageSize = 10, options = {}) {
  // Calculate skip and take values for pagination
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    // Perform paginated query on the specified model
    const [data, totalCount] = await Promise.all([
      prisma[modelName].findMany({
        skip,
        take,
        ...options, // Spread any additional query options
      }),
      prisma[modelName].count({
        where: options.where || {}, // Use `where` option if provided
      }),
    ]);

    // Calculate total pages based on page size
    const totalPages = Math.ceil(totalCount / pageSize);

    // Return data along with pagination metadata
    return {
      data,
      meta: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };
  } catch (error) {
    console.error(`Error paginating ${modelName}:`, error);
    throw new Error(`Could not paginate ${modelName}`);
  }
}

export default paginate;
