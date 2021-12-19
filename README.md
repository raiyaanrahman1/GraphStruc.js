# js-library-rahma694

Link to Landing Page: https://murmuring-harbor-20623.herokuapp.com

Link to Documentaion page: https://murmuring-harbor-20623.herokuapp.com/docs.html

<h2> Getting Started </h2>
        <p> No dependencies are needed for this library </p>
        <ol class="getting-started"> 
            <li> Navigate to https://murmuring-harbor-20623.herokuapp.com/download.html and click the link to download the script </a></li>
            <li>Copy it to your working directory (ie. your project folder - it can be in the same folder as your html file such as index.html, or in a separate folder. Just make sure to refer to the correct location in step 3)</li>
            <li>Add the following line of code in your html before <i>your</i>  script tag (ie. the JS for your html, where you will use the library): : <br> <code>&lt;script defer type="text/javascript" src="&lt;path/to/graphStruc.js&gt;"&gt;&lt;/script&gt;</code> <br> and replace &lt;path/to/graphStruc.js&gt; with the path to the file you just downloaded. This will just be "graphStruc.js" if your html and graphStruc file are in the same folder</li>
            <li>Add the <code>defer</code> attribute to <i>your</i> script tag (the JS for your html, where you will use the library)</li>
            <li>I suggest linking your style sheet <strong>before</strong> the graphStruc.js script tag, as graphs need to be placed in divs with an explicit height (see usage for details). If you are using an external JS file for <i>your</i> JavaScript, then your header should look similar to the following: 
                <br> 
                <pre>
                    <code>
                        &lt;link rel="stylesheet" href="styles.css"&gt;
                        &lt;script defer type="text/javascript" src="graphStruc.js"&gt;&lt;/script&gt;
                        &lt;script defer type="text/javascript" src="myJS.js"&gt;&lt;/script&gt;
                    </code>
                </pre>
                You are now setup! You can now create a graph with <code>new Graph()</code> in your JS file and access all public methods.
            </li>
        </ol>
