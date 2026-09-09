# Building Mining IR Platform: A Multi-Tenant Investor Relations Platform for Junior Mining Companies

Junior mining companies need to communicate complex information clearly. Projects, exploration
updates, technical documents, management profiles, share structure and upcoming catalysts all need
to be available to investors, while remaining accurate, reviewable and easy to maintain.

That is the problem behind **Mining IR Platform**: a self-service SaaS platform that gives each mining
company a professional investor relations website and a secure dashboard for managing its content.

## One Platform, Multiple Company Websites

Mining IR Platform is designed as a multi-tenant system. Each company has its own website, branding,
content and authorized users, while the underlying application is shared.

This approach gives smaller public companies access to a modern investor website without requiring a
separate custom application for every client. It also gives the platform owner a central place to
manage tenants, users, templates and permissions.

The public experience is designed around investors. Visitors can explore a company's projects, read
published news and documents, learn about its management team, review share structure and understand
the company's investment story without creating an account.

Company administrators manage their own content through a secure dashboard. A platform administrator
can manage the wider system without needing to enter each company's public website.

## Built For Responsible Disclosure

Mining information can be technically detailed and financially significant. The platform therefore
uses a controlled publishing workflow:

**Draft → Review → Published**

Content is not published automatically. Technical and material information must go through explicit
human approval, with reviewer metadata and source context retained internally. Machine-assisted
content, where introduced in the future, must remain identifiable and subject to the same human review
requirements.

The system also protects unpublished documents through private media authorization and limits public
responses to intentionally published information.

## A Practical Technical Foundation

The platform uses Next.js, React, TypeScript and Tailwind CSS for the web experience, Payload CMS for
content management, and PostgreSQL through Supabase for structured data. Vercel provides the initial
application hosting and Cloudflare supports the domain and DNS layer.

The architecture is designed around server-side tenant resolution and authorization. A company's
website is reached through its own hostname, while unknown or mistyped hostnames fail closed instead
of accidentally displaying another company's website.

The first public template is **Explorer**, designed for junior exploration companies. A second
presentation template, **Summit**, demonstrates how different visual experiences can share the same
data, publishing and security foundations.

## Proving The Multi-Tenant Model

The project uses fictional companies and clearly fictional content for development and demonstrations.
The current test tenants include Qelvarion Resource, Zenthoriq Resource and Veylithra Tungsten.

The purpose is not only to create attractive demo websites. Two differently shaped tenants provide a
meaningful test of the platform's most important promise: one company's unpublished information must
never appear on another company's website or in its API responses.

## Where The Project Is Now

The project has completed six development sprints covering the initial vertical slice, mining content,
production hardening, investor features, safe document ingestion and real-domain deployment. The live
platform domain now separates the platform marketing site, tenant websites and the administrator CMS.

The next stage is focused on completing the remaining operational checks, including Production backup
and restore evidence, final deployment observations and a final review before any real customer content
is accepted.

Mining IR Platform is being built as a careful foundation for a difficult category: making technical
mining information more accessible to investors without treating speed, automation or visual polish
as substitutes for accuracy and human responsibility.
