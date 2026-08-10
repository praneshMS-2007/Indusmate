import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether

def build_pdf():
    pdf_path = r"C:\Users\Pranesh\Downloads\HACKMATRIX_PROJECT_DOCUMENTATION_INDUSMATE.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom typography & color palette
    header_org_style = ParagraphStyle(
        'HeaderOrg',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#0F766E'),
        alignment=1, # Center
        spaceAfter=2
    )

    doc_banner_style = ParagraphStyle(
        'DocBanner',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        spaceAfter=2
    )

    doc_subbanner_style = ParagraphStyle(
        'DocSubBanner',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#D97706'),
        alignment=1,
        spaceAfter=8
    )

    section_heading = ParagraphStyle(
        'SecHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=4
    )

    sub_section_heading = ParagraphStyle(
        'SubSecHeading',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=colors.HexColor('#0F766E'),
        spaceBefore=6,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyCustom',
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
        leftIndent=10,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # 1. HEADER & BANNER
    story.append(Paragraph("IEEE COMPUTER SOCIETY STUDENT BRANCH CHAPTER", header_org_style))
    story.append(Paragraph("Madhav Institute of Technology and Science (MITS), Gwalior", header_org_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("HACKMATRIX 2026 — ROUND 2", doc_banner_style))
    story.append(Paragraph("CHOOSE YOUR REALITY. BUILD YOUR FUTURE.", doc_subbanner_style))
    story.append(Paragraph("OFFICIAL PROJECT DOCUMENTATION", ParagraphStyle('DocType', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, alignment=1, textColor=colors.HexColor('#1E293B'), spaceAfter=8)))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceAfter=10))

    # 2. METADATA TABLE
    meta_data = [
        [Paragraph("<b>Team Name</b>", table_header_style), Paragraph("<b>COLDSTACK</b>", table_body_style)],
        [Paragraph("<b>Team Leader</b>", table_header_style), Paragraph("Pranesh M S (praneshms2007@gmail.com / +91 9488344710)", table_body_style)],
        [Paragraph("<b>Problem Statement</b>", table_header_style), Paragraph("PS-B2B-01 (B2B Industrial Market Fragmentation & Supply Chain Inefficiency)", table_body_style)],
        [Paragraph("<b>Event Name</b>", table_header_style), Paragraph("HackMatrix 2026 - Round 2", table_body_style)],
        [Paragraph("<b>Project Title</b>", table_header_style), Paragraph("<b>IndusMate</b> — Unified Sealed B2B Industrial Engine & AI Symbiosis", table_body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[130, 410])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. LINKS TABLE
    story.append(Paragraph("PROJECT LINKS", section_heading))
    links_data = [
        [Paragraph("<b>GitHub Repository Link</b>", table_header_style), Paragraph("<u><font color='#0F766E'>https://github.com/praneshMS-2007/Indusmate</font></u> (Public)", table_body_style)],
        [Paragraph("<b>Live Deployed Link</b>", table_header_style), Paragraph("<u><font color='#0F766E'>https://indusmate.vercel.app</font></u> (Live on Vercel)", table_body_style)],
        [Paragraph("<b>Demo Walkthrough Link</b>", table_header_style), Paragraph("<u><font color='#0F766E'>https://github.com/praneshMS-2007/Indusmate/blob/main/DEMO.md</font></u>", table_body_style)],
    ]
    links_table = Table(links_data, colWidths=[130, 410])
    links_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(links_table)
    story.append(Spacer(1, 10))

    # 4. SUMMARY
    story.append(Paragraph("PROJECT SUMMARY", section_heading))
    story.append(Paragraph("<b>IndusMate</b> is a production-grade, unified B2B industrial trading platform designed specifically for Indian manufacturing MSMEs, fleet transporters, raw material suppliers, and recyclers. Built on the core insight that a raw material lot, an idle machine-hour, a technician's shift, a waste byproduct stream, and a truck's return leg are all instances of the same abstract object — a <i>listable capacity</i> with a specification, a location, a time window, and an undecided price.", body_style))
    story.append(Paragraph("By consolidating five distinct industrial markets (Freight, Raw Materials, Equipment, Byproducts, Skilled Labour) onto <b>one single database model and one universal deal state machine</b>, IndusMate eliminates the need for siloed portals. It introduces strict server-side sealed anonymous bidding to prevent price cartelization and middleman margins (12–18%), alongside an AI-powered byproduct symbiosis engine using Google Gemini 2.5 to match industrial waste streams with recycling feedstocks.", body_style))
    story.append(Spacer(1, 8))

    # 5. PROBLEM BEING SOLVED
    story.append(Paragraph("PROBLEM BEING SOLVED", section_heading))
    story.append(Paragraph("Indian industrial commerce operates through informal phone calls, fragmented WhatsApp groups, and commission brokers. This results in three critical failure points:", body_style))
    story.append(Paragraph("• <b>Broken Price Discovery & Middleman Markups:</b> Freight rates and raw material prices are set arbitrarily by intermediaries, imposing 12–18% unnecessary markups and inflating MSME operational costs.", bullet_style))
    story.append(Paragraph("• <b>Public Bid Leakage & Price Discrimination:</b> Traditional open tenders leak tenderer amounts before closing. Suppliers avoid submitting honest lowest prices because public disclosure exposes their commercial margins to rival buyers.", bullet_style))
    story.append(Paragraph("• <b>Unmapped Industrial Waste & Byproducts:</b> 68% of industrial waste (fly ash, slag, chemical sludge, spent catalyst) is landfilled because factories search materials by brand name rather than chemical composition, turning sellable resources into disposal costs.", bullet_style))
    story.append(Paragraph("• <b>Unutilized Logistics Fleet Backhaul:</b> Transporters return with empty trucks on 35% of interstate routes due to lack of real-time return-leg freight visibility.", bullet_style))
    story.append(Spacer(1, 8))

    # 6. UNIQUE SELLING POINT (USP)
    story.append(Paragraph("UNIQUE SELLING POINT (USP)", section_heading))
    story.append(Paragraph("• <b>One Engine, Five Markets:</b> Exactly one <code>Listing</code> database model and one state machine power all 5 markets. Adding a 6th market requires zero structural code changes — only a spec configuration payload.", bullet_style))
    story.append(Paragraph("• <b>Strict Server-Side Sealed Anonymity:</b> Bidders never see rival amounts. Listing owners view pseudonymous handles and reputation metrics (e.g. <i>Transporter #4471 · 4.7/5 · 128 deals</i>). Private identities (GSTIN, legal name, phone) are released strictly upon deal <code>ACCEPTED</code>.", bullet_style))
    story.append(Paragraph("• <b>AI Waste-to-Resource Symbiosis Engine:</b> Uses Google Gemini 2.5 LLM to analyze chemical & physical specifications of industrial byproducts and match selling factories directly with buying recyclers.", bullet_style))
    story.append(Paragraph("• <b>Enterprise Admin KYC & Real-Time Audit Logs:</b> Full multi-document KYC verification flow with dedicated administrative queue (`/admin/kyc`) and transparent audit logging (`/admin/logs`).", bullet_style))
    story.append(Paragraph("• <b>Sub-100ms Request-Level Performance:</b> Powered by Next.js 16 App Router, React 19, <code>React.cache()</code> query memoization, and Supabase PgBouncer connection pooling.", bullet_style))
    story.append(Spacer(1, 8))

    # 7. KEY FEATURES
    story.append(Paragraph("KEY FEATURES", section_heading))
    story.append(Paragraph("1. <b>Sealed-Bid Negotiation Engine:</b> Supports both Reverse Auctions (price competes down for freight/raw materials) and Forward Auctions (price competes up for scarce byproducts).", bullet_style))
    story.append(Paragraph("2. <b>Role-Aware Bento Dashboards:</b> Customized dashboards for Manufacturers, Transporters, Suppliers, and Recyclers with role-specific KPI metrics.", bullet_style))
    story.append(Paragraph("3. <b>AI Byproduct Symbiosis Matcher:</b> Automated chemical spec mapping, potential applications, per-tonne market valuation, and counterparty discovery.", bullet_style))
    story.append(Paragraph("4. <b>Admin KYC Verification & Audit History:</b> Platform administrators review factory licenses, GST certificates, and RC books with full state audit logs.", bullet_style))
    story.append(Paragraph("5. <b>Interactive Location & Route Tracking:</b> Built-in Leaflet OpenStreetMap interactive cluster map and distance calculator.", bullet_style))
    story.append(Paragraph("6. <b>Instant UX Feedback:</b> Form submit buttons feature <code>useFormStatus</code> zero-latency loading indicators to prevent duplicate submissions.", bullet_style))
    story.append(Spacer(1, 8))

    # 8. TECH STACK
    story.append(Paragraph("TECHNICAL STACK", section_heading))
    tech_data = [
        [Paragraph("<b>Layer</b>", table_header_style), Paragraph("<b>Technologies Used</b>", table_header_style), Paragraph("<b>Implementation Role</b>", table_header_style)],
        [Paragraph("<b>Frontend</b>", table_body_style), Paragraph("Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS + Tailwind v4", table_body_style), Paragraph("Mobile-first responsive UI, Server Components for identity masking", table_body_style)],
        [Paragraph("<b>Backend</b>", table_body_style), Paragraph("Next.js Server Actions, Web API Route Handlers, Node.js", table_body_style), Paragraph("Type-safe server actions, RESTful document APIs", table_body_style)],
        [Paragraph("<b>Database</b>", table_body_style), Paragraph("PostgreSQL (Supabase) + Prisma 6 ORM", table_body_style), Paragraph("Request-level React.cache() memoization, PgBouncer pooling", table_body_style)],
        [Paragraph("<b>AI / LLM</b>", table_body_style), Paragraph("Google Gemini 2.5 Flash API (@google/genai)", table_body_style), Paragraph("Automated byproduct waste stream matching & economic valuation", table_body_style)],
        [Paragraph("<b>Auth & Security</b>", table_body_style), Paragraph("Auth.js (NextAuth v5), Bcrypt, HTTP-only JWT Cookies", table_body_style), Paragraph("Credentials auth, RBAC guards, Admin KYC verification", table_body_style)],
        [Paragraph("<b>Deployment</b>", table_body_style), Paragraph("Vercel Cloud Serverless + Supabase Managed DB", table_body_style), Paragraph("Sub-100ms global production edge hosting", table_body_style)],
    ]
    tech_table = Table(tech_data, colWidths=[90, 210, 240])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 10))

    # 9. FUTURE SCOPE
    story.append(Paragraph("FUTURE SCOPE & ROADMAP", section_heading))
    story.append(Paragraph("• <b>Q3 2026 — Real-Time Counter-Offers & GSTN API:</b> Integrate WebSockets for live counter-bidding and automated government GSTN verification.", bullet_style))
    story.append(Paragraph("• <b>Q4 2026 — Payment Escrow Integration:</b> Integrate Razorpay / Cashfree escrow gateways to hold funds until milestone settlement.", bullet_style))
    story.append(Paragraph("• <b>Q1 2027 — Logistics Ecosystem Integration:</b> Connect directly with FASTag and NIC e-Way Bill portals for automated freight tracking.", bullet_style))
    story.append(Paragraph("• <b>2027+ — Industrial Hub Pilot & Scaling:</b> Deployment across Pithampur, Malanpur, and Mandideep industrial corridors, expanding to SAARC cross-border trade.", bullet_style))
    story.append(Spacer(1, 10))

    # 10. TEAM & EXECUTION
    story.append(Paragraph("TEAM & EXECUTION STATEMENT", section_heading))
    story.append(Paragraph("<b>Team COLDSTACK:</b> Pranesh M S (Lead / Full-Stack), Avinash A S (Frontend & Design Systems), Kannan S (Backend & Database Architecture), Yashwanth (QA & Testing).", body_style))
    story.append(Paragraph("<i>\"Combining deep expertise in full-stack Next.js web engineering, scalable database architecture, AI integration, and domain knowledge of Indian industrial supply chains to deliver a secure, frictionless B2B marketplace.\"</i>", body_style))

    doc.build(story)
    print("Project Documentation PDF build successful:", pdf_path)

if __name__ == "__main__":
    build_pdf()
