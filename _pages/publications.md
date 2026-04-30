---
layout: page
permalink: /publications/
title: Publications
description: Publications related to my PhD.
nav: true
nav_order: 2
---
### Preprints
{% bibliography --file works --query @*[category=preprint] --sort_by year --reverse %}

### Submitted 
{% bibliography --file works --query @*[category=submitted] --sort_by year --reverse %}

### Journal Articles
{% bibliography --file works --query @*[category=journal] --sort_by year --reverse %}

### Conference Papers 
{% bibliography --file works --query @*[category=procceding] --sort_by year --reverse %}

### Thesis 
{% bibliography --file works --query @*[category=thesis] --sort_by year --reverse %}