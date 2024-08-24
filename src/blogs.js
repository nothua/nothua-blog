import axios from 'axios';
import { getConfig } from './config.js';
import { log, error } from './logger.js';

const config = getConfig();

export async function getBlogs(){
    if(!config.owner || !config.repo || !config.branch || !config.token){
        error("Invalid configuration");
        return { blogs: [], error: "Invalid configuration" };
    }

    try{
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/blogs.json?ref=${config.branch}`;

        console.log(url);

        const response = await axios.get(url, {
            headers:{
                Authorization: `token ${config.token}`,
                Accept: 'application/vnd.github.v3.raw'                
            }
        })

        const blogs = response.data;

        return { blogs: blogs };
    }catch(err){
        error("Error fetching blogs: " + err.message);
        return { blogs: [], error: err.message };
    }
}

export async function getBlog(slug){
    if(!config.owner || !config.repo || !config.branch || !config.token){
        error("Invalid configuration");
        return { blog: null, error: "Invalid configuration" };
    }

    try{
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/blogs/${slug}.json?ref=${config.branch}`;

        const response = await axios.get(url, {
            headers:{
                Authorization: `token ${config.token}`,
                Accept: 'application/vnd.github.v3.raw'                
            }
        })

        const blog = response.data;

        return { blog: blog };
    }catch(err){
        error("Error fetching blog: " + err.message);
        return { blog: null, error: err.message };
    }
}

export async function newBlog(blog){
    try{

        const date = new Date();
        blog.date = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

        if (blog.image.startsWith('data:image')) {
            const image = blog.image.split(',');
            const imageBuffer = Buffer.from(image[1], 'base64');
            await uploadFile(`images/${blog.slug}.png`, imageBuffer, `Updated image: ${blog.title}`);

            blog.image = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/images/${blog.slug}.png`;
        }

        await uploadFile(`blogs/${blog.slug}.json`, JSON.stringify(blog), `New blog: ${blog.title}`);

        const { blogs } = await getBlogs();
        const existingBlogIndex = blogs.findIndex(b => b.slug === blog.slug);
        if (existingBlogIndex >= 0) {
            blogs[existingBlogIndex] = blog;
        } else {
            blogs.push(blog);
        }

        await uploadFile('blogs.json', JSON.stringify(blogs), `New blog: ${blog.title}`);

        log("New blog created: " + blog.title);
        return { success: true };
    }catch(ex){
        error("Error creating new blog: " + ex.message);
        return { error: ex.message };
    }
}
    

async function uploadFile(path, content, message){
    try{
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

        let sha;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `token ${config.token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });
            sha = response.data.sha;
        } catch (err) {
            if (err.response && err.response.status !== 404) {
                throw new Error(`Error fetching file info: ${path} : ${err.message}`);
            }
        }

        console.log(sha)

        const data = {
            message: message,
            content: Buffer.from(content).toString('base64'),
            branch: config.branch,
            sha: sha  
        }

        await axios.put(url, data, {
            headers:{
                Authorization: `token ${config.token}`,
                Accept: 'application/vnd.github.v3.raw'
            }
        })
    }catch(ex){
        throw new Error(`Error uploading file: ${path} : ${ex.message}`);
    }
}

export async function deleteBlog(slug){
    try{
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/blogs/${slug}.json`;

        const response = await axios.get(url, {
            headers:{
                Authorization: `token ${config.token}`,
                Accept: 'application/vnd.github.v3.raw'                
            }
        })

        const blog = response.data;

        await uploadFile(`blogs/${slug}.json`, JSON.stringify(blog), `Deleted blog: ${slug}`);

        const {blogs} = await getBlogs();
        const newBlogs = blogs.filter(b => b.slug !== slug);

        await uploadFile('blogs.json', JSON.stringify(newBlogs), `Deleted blog: ${slug}`);

        log("Blog deleted: " + slug);
        return { success: true };
    }catch(ex){
        error("Error deleting blog: " + ex.message);
        return { error: ex.message };
    }
}