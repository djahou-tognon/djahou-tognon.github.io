---
layout: page
permalink: /publications/
title: Publications
description: Publications related to my PhD.
nav: true
nav_order: 2
---
## Preprints
{% bibliography --query @*[category=preprint] --sort_by year --reverse %}

## Submitted 
{% bibliography --query @*[category=submitted] --sort_by year --reverse %}

## Journal Articles
{% bibliography --query @*[category=journal] --sort_by year --reverse %}

## Conference Papers 
{% bibliography --query @*[category=procceding] --sort_by year --reverse %}

## Thesis 
{% bibliography --query @*[category=thesis] --sort_by year --reverse %}