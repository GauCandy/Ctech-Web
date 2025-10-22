const fs = require('fs').promises;
const path = require('path');

/**
 * Get list of images for a specific 5C category
 */
async function getC5Images(req, res) {
  try {
    const { id } = req.params;

    // Validate ID (must be 1-5)
    if (!id || !['1', '2', '3', '4', '5'].includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 5C category ID. Must be 1-5.'
      });
    }

    // Path to 5C images folder
    const imagesPath = path.join(__dirname, '../../../../../frontend/img/5C', id);

    // Check if directory exists
    try {
      await fs.access(imagesPath);
    } catch (error) {
      // Directory doesn't exist, return empty array
      return res.json({
        success: true,
        images: []
      });
    }

    // Read directory
    const files = await fs.readdir(imagesPath);

    // Filter only image files (jpg, jpeg, png, webp, gif)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.JPG', '.JPEG', '.PNG', '.WEBP', '.GIF'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file);
      return imageExtensions.includes(ext);
    });

    // Sort files naturally (1.jpg, 2.jpg, ... 10.jpg)
    imageFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.match(/\d+/)?.[0] || '999');
      return numA - numB;
    });

    // Return image paths relative to /img/5C/{id}/
    const imagePaths = imageFiles.map(file => `/img/5C/${id}/${file}`);

    res.json({
      success: true,
      images: imagePaths
    });

  } catch (error) {
    console.error('Error getting 5C images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get images',
      error: error.message
    });
  }
}

module.exports = {
  getC5Images
};
