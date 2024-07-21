const { Post, Tag } = require('../models')

async function create(req, res, next) {
  const { title, body, tags } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const newPost = new Post({
      title,
      body,
      tags
    });

    await newPost.save();
    return res.status(200).json(newPost);
  } catch (err) {
    next(err);
  }
}

// should render HTML
async function get(req, res) {
  try {
    const slug = req.params.slug;
    const post = await Post.findOne({ slug }).populate('tags').lean();

    if (!post) {
      return res.status(404).send('Post not found');
    }

    post.createdAt = new Date(post.createdAt).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    post.comments = post.comments.map(comment => {
      comment.createdAt = new Date(comment.createdAt).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      return comment;
    });

    res.render('view-post', { post, isLoggedIn: req.session.isLoggedIn });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

// should render HTML
async function getAll(req, res) {
  try {
    const mongoQuery = {};
    if (req.query.tag) {
      const tagDoc = await Tag.findOne({ name: req.query.tag }).lean();
      if (tagDoc) {
        mongoQuery.tags = { _id: tagDoc._id };
      }
    }

    const postDocs = await Post.find(mongoQuery).populate('tags').sort({ createdAt: 'DESC' }).lean();
    const posts = postDocs.map(post => {
      post.createdAt = new Date(post.createdAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return post;
    });

    res.render('index', {
      posts,
      isLoggedIn: req.session.isLoggedIn,
      tag: req.query.tag
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function update(req, res) {
  try {
    const { title, body, tags } = req.body;
    const postId = req.params.id;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, body, tags },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).send('Post not found');
    }

    return res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function remove(req, res, next) {
  const postId = req.params.id;

  try {
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).send('Post not found');
    }

    return res.status(200).send('Post deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  get,
  getAll,
  create,
  update,
  remove
}
