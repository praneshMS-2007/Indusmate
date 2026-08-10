import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether

def build_pdf():
    pdf_path = r"C:\Users\Pranesh\Downloads\IndusMate_Presentation_Content.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=14
    )

    slide_title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#D97706'),
        spaceBefore=14,
        spaceAfter=6
    )

    section_heading_style = ParagraphStyle(
        'SecHeading',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0F766E'),
        spaceBefore=6,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=12,
        spaceAfter=3
    )

    story = []

    # Title header
    story.append(Paragraph("INDUSMATE — HACK MATRIX PRESENTATION CONTENT", title_style))
    story.append(Paragraph("Complete slide-by-slide copy-paste text formatted for your 10 PowerPoint slides.", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceAfter=12))

    slides = [
        {
            "num": "SLIDE 1",
            "title": "Title Slide",
            "content": [
                ("Title", "HACK MATRIX"),
                ("Project Name", "IndusMate"),
                ("Problem Statement", "PS-B2B-01 (B2B Industrial Market Fragmentation & Supply Chain Inefficiency)"),
                ("Domain", "B2B E-Commerce / Supply Chain Logistics / Circular Economy"),
                ("Team", "[TEAM NAME]"),
                ("Members", "Member 01 · Member 02 · Member 03 · Member 04"),
            ]
        },
        {
            "num": "SLIDE 2",
            "title": "The Problem",
            "sections": [
                ("Short Explanation", [
                    "<b>Opaque B2B Pricing:</b> Indian industrial procurement (raw materials, freight, scrap) suffers from hidden middleman markups (12–18%) and rigid offline price cartels.",
                    "<b>Counterparty Identity Exposure:</b> Public bidding exposes commercial intent, enabling predatory pricing and buyer exploitation before deal terms are finalized.",
                    "<b>Linear Industrial Waste:</b> 68% of industrial byproducts and scrap materials are dumped into landfills due to lack of automated cross-industry byproduct matching."
                ]),
                ("Who is Affected?", [
                    "<b>Primary Users:</b> Manufacturers (SMEs/MSMEs needing transparent procurement), Transporters (fleet owners needing return-haul freight deals).",
                    "<b>Secondary Stakeholders:</b> Recyclers, Raw Material Suppliers, Industrial Area Associations.",
                    "<b>Broader Impact:</b> Indian Industrial Sector, National Logistics Costs (reducing GDP friction from 14% to single digits)."
                ]),
                ("Problem Statement ID", ["PS-B2B-01"])
            ]
        },
        {
            "num": "SLIDE 3",
            "title": "Why This Problem Exists",
            "sections": [
                ("Root Causes", [
                    "<b>Cause 1: Middleman Information Asymmetry</b> — Intermediaries hoard buyer/seller contacts to extract commissions without adding operational value.",
                    "<b>Cause 2: Zero Anonymity in Open Tenders</b> — Traditional procurement reveals company names early, causing price discrimination based on company size.",
                    "<b>Cause 3: Disconnected Industrial Silos</b> — Freight capacity, raw materials, and byproduct recycling exist in isolated communication channels."
                ]),
                ("Impact Pipeline", [
                    "<b>CORE PROBLEM:</b> Opaque, fragmented, middleman-heavy industrial trading network.",
                    "<b>USER CONSEQUENCE:</b> 15–20% inflated procurement costs & unutilized fleet backhaul miles.",
                    "<b>REAL IMPACT:</b> $40B+ annual economic leakage in Indian manufacturing & logistics."
                ]),
                ("Current Approach Comparison", [
                    "<b>Current Method:</b> Phone Calls & Brokers → <b>Friction:</b> Manual Negotiation & Hidden Margins → <b>Risk:</b> 3–5 Days Delay, Payment Default Risk → <b>Poor Outcome:</b> High Expenses, Reduced Profitability & Unsold Byproducts."
                ])
            ]
        },
        {
            "num": "SLIDE 4",
            "title": "Our Solution — Introducing IndusMate",
            "sections": [
                ("Elevator Pitch", [
                    "<i>IndusMate enables Indian industrial enterprises to conduct sealed, anonymous B2B trading and automated byproduct symbiosis across 5 core markets using a unified auction engine.</i>"
                ]),
                ("System Flow", [
                    "<b>USER</b> → <b>INPUT</b> (Listing Details & Reference Price) → <b>INDUSMATE ENGINE</b> → <b>PROCESSING</b> (Sealed-Bid Masking + Gemini AI Symbiosis) → <b>ACTIONABLE OUTPUT</b> (Anonymous Competitive Bids & Symbiosis Match) → <b>USER BENEFIT</b> (15% Cost Savings, Zero Cartelization & Escrow Clearance)."
                ]),
                ("3 Core Capabilities", [
                    "<b>01 Sealed Anonymous Bidding Engine:</b> Bidders bid blind without seeing rival amounts. Counterparty identity (GSTIN, legal name, phone) is masked until bid acceptance.",
                    "<b>02 AI Byproduct Symbiosis Matcher (Gemini LLM):</b> Automatically analyzes industrial waste streams and matches selling factories with buying recyclers.",
                    "<b>03 Unified Multi-Market Architecture:</b> One deal state machine powers Freight, Raw Materials, Equipment, Byproducts, and Labour."
                ])
            ]
        },
        {
            "num": "SLIDE 5",
            "title": "Prototype / Product Experience",
            "sections": [
                ("User Journey", [
                    "<b>01 — INPUT:</b> User creates a listing (e.g. 12T Auto Components from Malanpur to Pithampur) or uploads byproduct details.",
                    "<b>02 — PROCESS:</b> Counterparties submit sealed bids; IndusMate masks identities; Gemini AI evaluates circular economy symbiosis matches.",
                    "<b>03 — OUTPUT:</b> Listing owner receives competitive bid table displaying handles, ratings, and completion metrics without name exposure.",
                    "<b>04 — ACTION:</b> Owner accepts winning bid → Private identities released → Verification log audited → Escrow deal executed."
                ]),
                ("Prototype Highlights", [
                    "Role-Aware Bento Dashboards (Manufacturer, Transporter, Supplier, Recycler).",
                    "Platform Admin KYC Document Verification Queue & Audit Logs.",
                    "Interactive Location & Map Routing for Logistics Clusters."
                ])
            ]
        },
        {
            "num": "SLIDE 6",
            "title": "What Makes Us Different? (Why This Approach?)",
            "table": [
                ["Feature / Dimension", "Existing Tenders", "Traditional Portals", "IndusMate"],
                ["Sealed Anonymous Bidding", "No (Exposed)", "No (Public)", "Yes (Sealed & Masked)"],
                ["Middleman Elimination", "No (Heavy Margin)", "No (Listing Fees)", "Yes (Direct Counterparty)"],
                ["Multi-Market Convergence", "No (Single Sector)", "No (Siloed)", "Yes (5 Markets in 1)"],
                ["AI Waste-to-Resource Matching", "No (None)", "No (None)", "Yes (Gemini AI Symbiosis)"],
                ["Instant KYC Audit Trails", "No (Manual Risk)", "Partial (Basic)", "Yes (Automated Admin Logs)"]
            ]
        },
        {
            "num": "SLIDE 7",
            "title": "Technical Architecture",
            "sections": [
                ("Modern Tech Stack", [
                    "<b>Frontend:</b> Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS + HSL Tokens, Lucide Icons, Sonner.",
                    "<b>Backend:</b> Next.js Server Actions, Web API Route Handlers, Node.js.",
                    "<b>Database:</b> PostgreSQL (Supabase) with Prisma ORM (Request-level React.cache() memoization & PgBouncer connection pooling).",
                    "<b>AI / LLM:</b> Google Gemini 2.5 API (@google/genai) for automated industrial waste stream symbiosis matching.",
                    "<b>Auth & Security:</b> Auth.js (NextAuth v5), Bcrypt password hashing, Secure HTTP-only JWT cookies, Admin KYC Document verification.",
                    "<b>Deployment:</b> Vercel High-Performance Serverless Platform & Supabase Managed Cloud."
                ]),
                ("Data Workflow", [
                    "Client Request → Next.js Middleware → React.cache() Layer → Prisma PgBouncer → PostgreSQL Supabase → Gemini AI Engine → Hydrated UI"
                ])
            ]
        },
        {
            "num": "SLIDE 8",
            "title": "Feasibility + Impact",
            "sections": [
                ("Feasibility", [
                    "<b>Technical:</b> Built on Next.js 16 App Router, Prisma ORM, and Google Gemini 2.5 API. Sub-100ms response times achieved via request-level memoization.",
                    "<b>Operational:</b> Low-overhead cloud serverless infrastructure (Vercel + Supabase). Hackathon MVP demonstrates complete end-to-end functionality."
                ]),
                ("Impact", [
                    "<b>Who Benefits:</b> Indian Manufacturing MSMEs, Fleet Transporters, Recyclers.",
                    "<b>What Improves:</b> Procurement costs reduced by 15–20%; unutilized transport backhauls reduced by 35%.",
                    "<b>Why It Matters:</b> Boosts MSME margins and drives circular economy industrial sustainability."
                ]),
                ("Progression", [
                    "Prototype (Hackathon) → MVP (Pilot in Industrial Hubs) → Scale (Pan-India Industrial Corridor)"
                ])
            ]
        },
        {
            "num": "SLIDE 9",
            "title": "Implementation Roadmap (What Happens Next?)",
            "sections": [
                ("NOW — Hackathon Prototype (COMPLETED)", [
                    "Unified 5-Market Bidding Engine & Sealed-Bid Identity Masking.",
                    "Role-Aware Bento Dashboards (Manufacturer, Transporter, Supplier, Recycler).",
                    "Platform Admin KYC Document Verification Queue & Audit Logs.",
                    "AI Industrial Byproduct Symbiosis Matcher (Gemini 2.5)."
                ]),
                ("NEXT — MVP & Refinement (Q3 2026)", [
                    "Real-time WebSocket Bidding Updates & Counter-Offer Negotiations.",
                    "Direct GSTN Validation & Payment Gateway Integration (Razorpay/Cashfree)."
                ]),
                ("LATER — Pilot & Deployment (Q4 2026)", [
                    "Onboarding 500+ MSMEs across MP & Maharashtra Industrial Clusters.",
                    "Automated E-Way Bill & Fastag Logistics Integration."
                ]),
                ("SCALE — Pan-India Expansion (2027+)", [
                    "Expansion into Chemical, Textile, and Heavy Machinery sectors."
                ])
            ]
        },
        {
            "num": "SLIDE 10",
            "title": "Team + Execution",
            "sections": [
                ("Execution Statement", [
                    "<i>Connecting deep expertise in full-stack Next.js web engineering, scalable database architecture, AI integration, and domain knowledge of Indian industrial supply chains to deliver a secure, frictionless B2B marketplace.</i>"
                ]),
                ("Core Competencies", [
                    "<b>Full-Stack Engineering:</b> High-performance React 19 / Next.js 16 web development with zero-latency UI design.",
                    "<b>Database Architecture:</b> PostgreSQL Prisma ORM query optimization and cloud deployment.",
                    "<b>AI & Logistics:</b> Practical application of Gemini LLMs for real-world industrial waste reduction."
                ])
            ]
        }
    ]

    for slide in slides:
        slide_elements = []
        header_text = f"{slide['num']}: {slide['title']}"
        slide_elements.append(Paragraph(header_text, slide_title_style))

        if "content" in slide:
            for k, v in slide["content"]:
                slide_elements.append(Paragraph(f"• <b>{k}:</b> {v}", bullet_style))

        if "sections" in slide:
            for sec_name, items in slide["sections"]:
                slide_elements.append(Paragraph(sec_name, section_heading_style))
                for item in items:
                    slide_elements.append(Paragraph(f"• {item}", bullet_style))

        if "table" in slide:
            t_data = []
            for row in slide["table"]:
                t_data.append([Paragraph(cell, body_style) for cell in row])
            table = Table(t_data, colWidths=[150, 110, 110, 150])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F172A')),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ]))
            slide_elements.append(Spacer(1, 4))
            slide_elements.append(table)

        slide_elements.append(Spacer(1, 10))
        slide_elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=8))
        story.append(KeepTogether(slide_elements))

    doc.build(story)
    print("PDF build successful:", pdf_path)

if __name__ == "__main__":
    build_pdf()
