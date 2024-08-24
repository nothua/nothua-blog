const preloader = document.querySelector('.preloader');

function fadeOutPreloader() {
    const pageContent = document.querySelector('.page-content');
    setTimeout(() => {
        preloader.style.display = 'none'; 
        pageContent.style.display = 'block'; 
        pageContent.style.opacity = 1; 
    }, 500);
}

async function getConfig(){
    try {
        const response = await window.api.readConfig();
        const { config, error } = response;

        if (error) {
            console.error("Failed to load config:", error);
            return;
        }
        
        setConfigToModal(config);
    } catch (err) {
        console.error("Error loading config:", err);
    }
}

function setConfigToModal(config) {
    document.getElementById('githubUsername').value = config.owner;
    document.getElementById('githubRepo').value = config.repo;
    document.getElementById('githubToken').value = config.token;
}

async function loadBlogs() {
    try {
        const response = await window.api.readBlog();
        const { blogs, error } = response;

        if (error) {
            console.error("Failed to load blogs:", error);

            if (error === 'Invalid config') {
                setupGithub();
            }
            return;
        }

        renderBlogs(blogs);
    } catch (err) {
        console.error("Error loading blogs:", err);
    } finally {
        fadeOutPreloader(); 
    }
}

function renderBlogs(blogs) {
    const blogContainer = document.getElementById('blogContainer');
    blogContainer.innerHTML = '';

    blogs.forEach(blog => {
        const blogElement = document.createElement('div');
        blogElement.classList.add('blog-card');
        blogElement.innerHTML = `
            <div class="card">
                <img src="${blog.image}" class="card-img-top" alt="${blog.title}">
                <div class="card-body">
                    <h5 class="card-title">${blog.title}</h5>
                    <p class="card-text">${blog.shortDescription}</p>
                    <button class="btn btn-primary edit-blog" data-id="${blog.slug}">Edit</button>
                    <button class="btn btn-danger delete-blog" data-id="${blog.slug}">Delete</button>
                </div>
            </div>
        `;
        blogContainer.appendChild(blogElement);
    });

    setUpBlogEventListeners();
}

function setUpBlogEventListeners() {
    document.querySelectorAll('.edit-blog').forEach(button => {
        button.addEventListener('click', async (event) => {
            const slug = event.target.getAttribute('data-id');
            await openEditBlogModal(slug);
        });
    });

    document.querySelectorAll('.delete-blog').forEach(button => {
        button.addEventListener('click', async (event) => {
            const slug = event.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this blog?')) {
                await deleteBlog(slug);
                await loadBlogs();
            }
        });
    });
}

async function openEditBlogModal(slug) {
    try {
        const response = await window.api.getBlog(slug);
        const { blog, error } = response;

        console.log(response)

        if (error) {
            console.error("Failed to load blog for editing:", error);
            return;
        }

        populateBlogModal(blog);

        const createBlogModal = new bootstrap.Modal(document.getElementById('createBlogModal'));
        createBlogModal.show();
    } catch (err) {
        console.error("Error opening edit blog modal:", err);
    }
}

function populateBlogModal(blog) {
    document.getElementById('createBlogModalLabel').innerText = 'Edit Blog';
    document.getElementById('blogTitle').value = blog.title;
    document.getElementById('blogShortDescription').value = blog.shortDescription;
    quill.container.firstChild.innerHTML = blog.content;
    document.getElementById('createBlog').setAttribute('data-id', blog.slug);

    const fileInput = document.getElementById('blogImage');
    const imageButtons = document.getElementById('imageButtons');
    fileInput.value = '';
    imageButtons.style.display = 'none';

    if (blog.image) {
        setBlogImagePreview(blog.image);
    }
}

function setBlogImagePreview(imageUrl) {
    const imageButtons = document.getElementById('imageButtons');
    imageButtons.style.display = 'block';
    document.getElementById('modalImagePreview').src = `${imageUrl}?timestamp=${new Date().getTime()}`;
}

async function deleteBlog(slug) {
    try {
        const response = await window.api.deleteBlog(slug);
        if (response.success) {
            alert('Blog deleted successfully!');
            loadBlogs(); 
        } else {
            alert('Failed to delete blog: ' + response.error);
        }
    } catch (err) {
        console.error('Error deleting blog:', err);
        alert('Error deleting blog. Please try again.');
    }
}

document.getElementById('createBlog').addEventListener('click', async () => {
    await saveBlog();
});

async function saveBlog() {
    const title = document.getElementById('blogTitle').value;
    const imageFile = document.getElementById('blogImage').files[0];
    const shortDescription = document.getElementById('blogShortDescription').value;
    const content = quill.root.innerHTML;
    const slug = document.getElementById('createBlog').getAttribute('data-id') || generateSlug(title);

    if (!title || !content) {
        alert('Please enter a title and content.');
        return;
    }

    const blog = {
        slug,
        title,
        shortDescription,
        content,
        image: imageFile ? await getBase64Image(imageFile) : ''
    };

    try {
        const response = await window.api.saveBlog(blog);
        if (response.success) {
            alert('Blog saved successfully!');
            resetBlogModal();
            await loadBlogs(); 
        } else {
            alert('Failed to save blog: ' + response.error);
        }
    } catch (err) {
        console.error('Error saving blog:', err);
        alert('Error saving blog. Please try again.');
    }
}

function resetBlogModal() {
    document.getElementById('createBlogModalLabel').innerText = 'Create Blog';
    document.getElementById('createBlog').removeAttribute('data-id');
    document.getElementById('blogTitle').value = '';
    document.getElementById('blogShortDescription').value = '';
    quill.root.innerHTML = '';
    document.getElementById('blogImage').value = '';
    document.getElementById('imageButtons').style.display = 'none';
    document.getElementById('modalImagePreview').src = '';
}

function convertHtmlToMarkdown(html) {
    const turndownService = new TurndownService();
    return turndownService.turndown(html);
}

function setMarkdownToQuill(markdown) {
    const html = marked(markdown);
    quill.root.innerHTML = html;
}

function getBase64Image(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function generateSlug(title) {
    return title
        .toLowerCase()                
        .trim()                       
        .replace(/[\s\W-]+/g, '-')      
        .replace(/^-+|-+$/g, '');      
}

function setupGithub() {
    const setupGithubModal = new bootstrap.Modal(document.getElementById('setupGithubModal'));
    setupGithubModal.show();

    document.getElementById('saveGithubConfig').addEventListener('click', async () => {
        const username = document.getElementById('githubUsername').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();
        const token = document.getElementById('githubToken').value.trim();

        if (!username || !repo || !token) {
            alert('Please fill in all fields.');
            return;
        }

        const configData = {
            owner: username,
            repo: repo,
            token: token,
            branch: 'main'
        };

        try {
            await window.api.saveConfig(configData);
            alert('GitHub configuration saved successfully!');
            setupGithubModal.hide();
        } catch (err) {
            console.error('Error saving GitHub config:', err);
            alert('Error saving GitHub config. Please try again.');
        }
    });
}

window.addEventListener('load', () => {
    loadBlogs(); 
});

let quill = new Quill('#editor', {
    theme: 'snow'
});

document.getElementById('blogImage').addEventListener('change', handleImageChange);
document.getElementById('previewImageBtn').addEventListener('click', showImagePreviewModal);
document.getElementById('removeImageBtn').addEventListener('click', clearImagePreview);

function handleImageChange() {
    const fileInput = document.getElementById('blogImage');
    if (fileInput.files && fileInput.files[0]) {
        setBlogImagePreviewFromFile(fileInput.files[0]);
    }
}

function setBlogImagePreviewFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('modalImagePreview').src = e.target.result;
    }
    reader.readAsDataURL(file);
    document.getElementById('imageButtons').style.display = 'block';
}

function showImagePreviewModal() {
    const imagePreviewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
    imagePreviewModal.show();
}

function clearImagePreview() {
    document.getElementById('blogImage').value = '';
    document.getElementById('modalImagePreview').src = '';
    document.getElementById('imageButtons').style.display = 'none';
}
