---
layout: notes
name: Goals
description: A list of past or active goals.
---
<h1>{{page.name}}</h1>


<h2>Weight</h2>

<pre class="mermaid" >
---
  config:
    xyChart:
      tickWidth: 10
      tickLength: 10
    themeVariables:
      titleColor: "#00ff00" 
---
  xychart-beta
    title "Weight" 
    x-axis [1, 2, 3] 
    y-axis "lbs" 175 --> 200
    line [196.6, 196.0, 194.6]
</pre>
