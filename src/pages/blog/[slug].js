import * as React from 'react'
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import { useCMS, useCMSForm, useWatchFormValues } from 'react-tinacms'

import blogStyles from "../../styles/pages/blog.scss";
import Layout from '../../components/Layout'

export default function Page(props) {
  // TINA CMS Config ---------------------------

  const cms = useCMS()
  const [post, form] = useCMSForm({
    id: props.fileRelativePath, // needs to be unique
    label: 'Edit Post',

    // starting values for the post object
    initialValues: {
      fileRelativePath: props.fileRelativePath,
      frontmatter: props.data,
      markdownBody: props.content
    },

    // field definition
    fields: [
      {
        label: "Hero Image",
        name: 'frontmatter.hero_image',
        component: "image",
        // Generate the frontmatter value based on the filename
        parse: filename => `../static/${filename}`,
  
        // Decide the file upload directory for the post
        uploadDir: () => "/src/static/",
  
        // Generate the src attribute for the preview image.
        previewSrc: data => `/static/${data.frontmatter.hero_image}`,
      },
      {
        name: 'frontmatter.title',
        label: 'Title',
        component: 'text',
      },
      {
        name: 'frontmatter.date',
        label: 'Date',
        component: 'date',
      },
      {
        name: 'frontmatter.author',
        label: 'Author',
        component: 'text',
      },
      {
        name: 'markdownBody',
        label: 'Blog Body',
        component: 'markdown',
      },
      
    ],

    // save & commit the file when the "save" button is pressed
    onSubmit(data) {
      return cms.api.git
        .writeToDisk({
          fileRelativePath: props.fileRelativePath,
          content: JSON.stringify({ title: formState.values.title }),
        })
        .then(() => {
          return cms.api.git.commit({
            files: [props.fileRelativePath],
            message: `Commit from Tina: Update ${data.fileRelativePath}`,
          })
        })
    },
  })

  //TODO - fix, not currently writing to disk
  const writeToDisk = React.useCallback(formState => {
    console.log(formState.values)
    cms.api.git.onChange({
      fileRelativePath: props.fileRelativePath,
      content: JSON.stringify(formState.values),
    })
  }, [])

  useWatchFormValues(form, writeToDisk)

  // END Tina CMS config -----------------------------

  function reformatDate(fullDate) {
    const date = new Date(fullDate)
    return date.toDateString().slice(4);
  }

  return (
      <Layout>
      <article className={blogStyles.blog}>
          <figure className={blogStyles.blog__hero}>
          <img
              src={post.frontmatter.hero_image}
              alt={`blog_hero_${post.frontmatter.title}`}
          />
          </figure>
          <div className={blogStyles.blog__info}>
          <h1>{post.frontmatter.title}</h1>
          <h3>{reformatDate(post.frontmatter.date)}</h3>
          </div>
          <div className={blogStyles.blog__body}>
          <ReactMarkdown source={post.markdownBody} />
          </div>
          <h2 className={blogStyles.blog__footer}>
          Written By: {post.frontmatter.author}
          </h2>
      </article>
      </Layout>
    );

}

Page.getInitialProps = async function(ctx) {
  const { slug } = ctx.query
  const content = await import(`../../posts/${slug}.md`)
  const data = matter(content.default);

  return {
    fileRelativePath: `/posts/${slug}.md`,
    ...data
  }
}