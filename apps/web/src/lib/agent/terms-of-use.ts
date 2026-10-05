import { siteConfig } from "@/lib/site-config";

import type { SitePage } from "./page-content";
import { GENERAL_LEGAL_CREDIT, link, p, section, strong } from "./page-content";

/**
 * The Terms of Use, adapted from General Legal's website terms of use
 * template with its JAMS arbitration clause. Sections keep their numbers so
 * the cross-references hold; when the product changes, change this text in
 * the same commit.
 */

const LAST_REVISED = "October 3, 2026";

const email = link(siteConfig.email, `mailto:${siteConfig.email}`);

const privacyUrl = `${siteConfig.url}/privacy`;

const privacyLink = link(privacyUrl, privacyUrl);

/** A numbered subsection: "N.M Title. Text". */
const clause = (number: string, title: string, ...text: Parameters<typeof p>) =>
  p(`${number} `, strong(title), ...text);

export const terms: SitePage = {
  description:
    "The terms that govern your use of the Init website, including its documentation, live demo app and API.",
  footnote: GENERAL_LEGAL_CREDIT,
  path: "/terms",
  preamble: [
    p(strong("Version 1.0 Last revised:"), ` ${LAST_REVISED}`),
    p(
      'The website located at init.kyh.io (the "',
      strong("Site"),
      '") is owned and operated by Kaiyu Hsu ("',
      strong("Init"),
      '," "',
      strong("us"),
      '," "',
      strong("our"),
      '," or "',
      strong("we"),
      '"). Certain features of the Site may be subject to additional guidelines or rules posted on the Site, which are incorporated by reference into these Terms.',
    ),
    p(
      'These Terms of Use ("',
      strong("Terms"),
      '") govern your use of the Site. By accessing or using the Site, or by clicking "I agree" (or a similar button or checkbox) when that option is presented to you, you agree to these Terms on behalf of yourself or the entity you represent, and you confirm that you have the authority to do so. You must be at least 18 years old to use the Site. If you do not agree to these Terms, please do not use the Site.',
    ),
    p(
      strong("IMPORTANT – PLEASE READ SECTION 11 CAREFULLY."),
      " It contains an agreement to resolve disputes through binding individual arbitration instead of in court, and includes a waiver of class action rights and jury trial rights. You have 30 days to opt out of the arbitration agreement, as further described in Section 11.",
    ),
  ],
  sections: [
    section(
      "1. Accounts",
      clause(
        "1.1",
        "Creating an Account.",
        " Some features of the Site may require you to register for an account. When you register, you agree to provide accurate and complete information and to keep that information current. You can have your account deleted at any time by emailing us at ",
        email,
        ". We may suspend or terminate your account as described in Section 8.",
      ),
      clause(
        "1.2",
        "Account Security.",
        " You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. If you believe your account has been accessed without your authorization, please notify us immediately. We are not liable for any losses resulting from your failure to keep your credentials secure.",
      ),
    ),
    section(
      "2. Access to the Site",
      clause(
        "2.1",
        "License.",
        " Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Site for your own personal or internal business purposes.",
      ),
      clause(
        "2.2",
        "Restrictions.",
        " You may not: (i) license, sell, rent, lease, transfer, assign, distribute, or commercially exploit the Site or any content on it; (ii) modify, create derivative works from, disassemble, reverse-compile, or reverse-engineer any part of the Site; (iii) access the Site in order to build a similar or competing product or service; or (iv) copy, reproduce, distribute, republish, download, display, post, or transmit any part of the Site except as expressly permitted by these Terms. All copyright and proprietary notices on the Site must be kept intact on any copies you are permitted to make.",
      ),
      clause(
        "2.3",
        "Changes to the Site.",
        " We may modify, suspend, or discontinue the Site (or any part of it) at any time, with or without notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.",
      ),
      clause(
        "2.4",
        "No Support Obligation.",
        " We have no obligation to provide you with support or maintenance for the Site.",
      ),
      clause(
        "2.5",
        "Ownership.",
        " All intellectual property rights in the Site and its content – including copyrights, patents, trademarks, and trade secrets – belong to Init or its suppliers, except for Your Content (Section 2.7). These Terms do not transfer any ownership rights to you, except for the limited access rights in Section 2.1. All rights not expressly granted are reserved.",
      ),
      clause(
        "2.6",
        "Feedback.",
        " If you share feedback or suggestions about the Site with us, you grant us a perpetual, irrevocable, worldwide, non-exclusive, fully-paid, royalty-free license to use that feedback freely, in any manner and for any purpose, without attribution. Please do not submit any feedback that you consider proprietary or confidential.",
      ),
      clause(
        "2.7",
        "Your Content.",
        ' The Site lets you create and upload content, such as the organizations you set up, the todos you add to them and your profile picture ("',
        strong("Your Content"),
        "\"). You keep whatever rights you have in Your Content. You grant us a non-exclusive, worldwide, royalty-free license to host, store, copy and display Your Content solely to operate the Site and provide it to you, including by showing Your Content to the other members of the organizations you share it with. You are responsible for Your Content, and you represent that you have all the rights needed to submit it and that it does not violate these Terms, applicable law or anyone else's rights.",
      ),
      clause(
        "2.8",
        "Permitted Uses.",
        " Notwithstanding Section 2.2, you may crawl and index the Site's public pages (other than the paths its robots.txt file disallows), including the machine-readable versions the Site offers, such as /llms.txt and the Markdown version of each page, and you may use their content as input to AI systems and to train AI models, as the content signals in the Site's robots.txt file allow.",
      ),
      clause(
        "2.9",
        "Open-Source Software.",
        " Source code that we publish under an open-source license, such as the MIT License, is governed by that license, and nothing in these Terms limits your rights under it. Init's source code, including the documentation in its repository, is published under the MIT License at ",
        link(siteConfig.repository, siteConfig.repository),
        ". These Terms govern the hosted Site.",
      ),
      clause(
        "2.10",
        "Subscriptions and Payments.",
        " The Site lets the owners and admins of an organization start a paid subscription for it. Payments are processed by Stripe on its own checkout page and under its own terms, and your payment details are collected by Stripe, not by us. A subscription renews at the end of each billing period until it is canceled, and an organization's owners and admins can manage it through Stripe's billing portal, which opens from the organization's billing page. Closing your account or deleting an organization does not cancel a subscription on its own, so cancel it from the organization's billing page first.",
      ),
    ),
    section(
      "3. Privacy",
      p(
        "Your use of the Site is also governed by our Privacy Policy, which is available at ",
        privacyLink,
        " and is incorporated into these Terms by reference. The Privacy Policy describes the types of personal data and other information we collect from you or your device, how we use that information, and the circumstances under which we may share it with third parties.",
      ),
      clause(
        "3.1",
        "Processing of Personal Data.",
        " By using the Site, you acknowledge that you have read and understand our Privacy Policy and that Init will process your personal data and other information in accordance with the Privacy Policy. If there is a conflict between these Terms and the Privacy Policy with respect to the collection, use, or processing of your personal data, the Privacy Policy will control.",
      ),
      clause(
        "3.2",
        "Cookies and Tracking Technologies.",
        ' The Site may use cookies, web beacons, pixels, and similar tracking technologies ("',
        strong("Tracking Technologies"),
        '") to collect information about your use of the Site. For details on what Tracking Technologies the Site uses, what information they collect, and how you can manage your preferences, please refer to the ',
        link("Tracking & Other Technologies", `${privacyUrl}#tracking--other-technologies`),
        " section of our Privacy Policy.",
      ),
    ),
    section(
      "4. Indemnification",
      p(
        "You agree to defend, indemnify, and hold harmless Init and its officers, employees, and agents from any claims and reasonable costs or attorneys' fees arising out of (i) your use of the Site, (ii) your violation of these Terms, or (iii) your violation of any applicable law or regulation. We may assume control of the defense of any such claim at your expense, and you agree to cooperate with our defense. You agree not to settle any such claim without our prior written consent. We will make reasonable efforts to notify you promptly of any claim we become aware of.",
      ),
    ),
    section(
      "5. Third-Party Services & Other Users",
      clause(
        "5.1",
        "Third-Party Services.",
        " The Site may include links to or integrations with third-party websites or services, such as GitHub sign-in and Stripe's checkout (collectively, \"",
        strong("Third-Party Services"),
        "\"). We do not control, endorse, or take responsibility for any Third-Party Services. You use all Third-Party Services at your own risk, and you acknowledge and agree that the applicable third party's own terms and privacy practices will apply to such use.",
      ),
      clause(
        "5.2",
        "Other Users.",
        " Your interactions with other users of the Site are solely between you and those users. We are not responsible for any loss or harm resulting from those interactions, and we reserve the right, but have no obligation, to get involved in disputes between users.",
      ),
      clause(
        "5.3",
        "Release.",
        ' To the fullest extent permitted by law, you release Init and its officers, employees, agents, successors, and assigns from all claims, demands, and damages of any kind arising out of or related to the Site, other users, or Third-Party Services. If you are a California resident, you waive California Civil Code Section 1542, which provides: "A general release does not extend to claims which the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release, which if known by him or her must have materially affected his or her settlement with the debtor or released party."',
      ),
    ),
    section(
      "6. Disclaimers",
      p(
        'THE SITE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT PERMITTED BY LAW, INIT AND ITS SUPPLIERS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL CODE. WHERE APPLICABLE LAW REQUIRES WARRANTIES, THEY ARE LIMITED TO 90 DAYS FROM YOUR FIRST USE.',
      ),
    ),
    section(
      "7. Limitation of Liability",
      p(
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW: (A) INIT AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY LOST PROFITS, LOST DATA, COSTS OF SUBSTITUTE PRODUCTS, OR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF (OR INABILITY TO USE) THE SITE; AND (B) OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING UNDER THESE TERMS IS CAPPED AT THE GREATER OF (i) $50 USD AND (ii) THE AMOUNT PAID TO INIT BY YOU UNDER THESE TERMS IN THE SIX MONTHS PRIOR TO THE INCIDENT GIVING RISE TO THE CLAIM. THE EXISTENCE OF MULTIPLE CLAIMS DOES NOT INCREASE THIS CAP.",
      ),
    ),
    section(
      "8. Term and Termination",
      p(
        "These Terms remain in effect while you use the Site. We may suspend or terminate your access (including suspending access to or deleting your account) at any time and for any reason, including if we believe you have violated these Terms. We are not liable to you for any such termination. Upon termination, Sections 2.2 through 2.6, Sections 2.9 and 2.10 and Sections 3 through 11 will survive.",
      ),
    ),
    section(
      "9. State-Specific Legal Notices",
      p(
        "The provisions in this Section 9 apply only to users to the extent such users are subject to the laws of the applicable states identified below. If a provision in this section conflicts with another provision of these Terms, the state-specific provision controls for users subject to that state's laws.",
      ),
      clause(
        "9.1",
        "California.",
        " If you are a California resident, you may report complaints to the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs, at 1625 N. Market Blvd. Suite N112, Sacramento, CA 95834, or by phone at (800) 952-5210. Under California Civil Code Section 1789.3, California users of the Site are entitled to the following specific consumer rights notice: The provider of the Site is Kaiyu Hsu. To file a complaint regarding the Site, or to receive further information regarding use of the Site, contact us at ",
        email,
        ". You may also contact the Complaint Assistance Unit at the address and phone number above. If you are a California resident, you may have additional rights under the California Consumer Privacy Act (as amended by the California Privacy Rights Act), including the right to know what personal information we collect, the right to delete your personal information, the right to correct inaccurate personal information, and the right to opt out of the sale or sharing of your personal information. For details on how to exercise these rights, please see our Privacy Policy at ",
        privacyLink,
        ".",
      ),
      clause(
        "9.2",
        "Colorado.",
        " If you are a Colorado resident, you may have additional rights under the Colorado Privacy Act (CPA), including the right to opt out of the processing of your personal data for purposes of targeted advertising, the sale of personal data, and certain profiling. For details, please see our Privacy Policy.",
      ),
      clause(
        "9.3",
        "Connecticut.",
        " If you are a Connecticut resident, you may have additional rights under the Connecticut Data Privacy Act (CTDPA), including rights of access, correction, deletion, and data portability, as well as the right to opt out of the sale of personal data, targeted advertising, and profiling. For details, please see our Privacy Policy.",
      ),
      clause(
        "9.4",
        "Virginia.",
        " If you are a Virginia resident, you may have additional rights under the Virginia Consumer Data Protection Act (VCDPA), including the right to access, correct, delete, and obtain a copy of your personal data, and the right to opt out of the processing of your personal data for targeted advertising, sale, or profiling. For details, please see our Privacy Policy.",
      ),
      clause(
        "9.5",
        "Nevada.",
        " If you are a Nevada resident, you have the right under Nevada Revised Statutes Chapter 603A to direct us not to sell certain information we have collected or will collect about you. To exercise this right, please contact us at ",
        email,
        ".",
      ),
      clause(
        "9.6",
        "Other States.",
        " If you are a resident of another U.S. state with a comprehensive consumer privacy law, such as Texas, Oregon, Montana, Utah, Iowa, Indiana or Tennessee, you may have similar rights under that law. For details, please see our Privacy Policy.",
      ),
    ),
    section(
      "10. General",
      clause(
        "10.1",
        "Changes to Terms.",
        " We may update these Terms from time to time. If we make material changes, we may notify you by email (at the address on file) or by a prominent notice on the Site. Your continued use of the Site after notice of changes means you accept the updated Terms.",
      ),
      clause(
        "10.2",
        "Governing Law.",
        " These Terms and any dispute arising out of or related to these Terms or the Site will be governed by and construed in accordance with the laws of the State of California, without regard to its conflict-of-law principles. For any claim or dispute not subject to the arbitration provisions in Section 11, you and Init irrevocably consent to the exclusive jurisdiction and venue of the state and federal courts located in San Francisco County, California. Notwithstanding the foregoing: (a) either party may bring an action in any court of competent jurisdiction for injunctive or other equitable relief to protect its intellectual property rights (including patents, copyrights, trademarks, and trade secrets); and (b) either party may bring an individual action in small claims court for claims within that court's jurisdictional limits.",
      ),
      clause(
        "10.3",
        "Export.",
        " You agree not to export, re-export, or transfer any technical data or products acquired from the Site in violation of U.S. export control laws or applicable regulations in other countries.",
      ),
      clause(
        "10.4",
        "Electronic Communications.",
        " By using the Site, you consent to receiving communications from us electronically (by email or notices posted on the Site). These electronic communications satisfy any legal requirement for written notice.",
      ),
      clause(
        "10.5",
        "Accessibility.",
        " Init is committed to making the Site accessible to all users, including individuals with disabilities. We endeavor to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, as published by the World Wide Web Consortium (W3C). If you experience any difficulty accessing or navigating the Site, or if you have suggestions for improving accessibility, please contact us at ",
        email,
        ". We will make reasonable efforts to address accessibility concerns promptly.",
      ),
      clause(
        "10.6",
        "Entire Agreement.",
        ' These Terms (together with the Privacy Policy and any other policies or guidelines referenced herein) are the entire agreement between you and Init regarding your use of the Site. If any provision of these Terms is found to be invalid or unenforceable, it will be modified to the minimum extent necessary to be valid, and the remaining provisions will continue in effect. Our failure to enforce any provision is not a waiver of that provision. The word "including" means "including without limitation." You may not assign these Terms without our prior written consent; we may assign them freely. These Terms bind any permitted assignees.',
      ),
      clause(
        "10.7",
        "Copyright/Trademark.",
        " Copyright © 2026 Kaiyu Hsu. All rights reserved. All trademarks, logos, and service marks displayed on the Site are owned by Init or third parties. You may not use any of them without prior written consent from the owner. Open-source code is licensed as described in Section 2.9.",
      ),
      clause("10.8", "Contact Information:", " ", email),
    ),
    section(
      "11. Dispute Resolution",
      p(
        strong(
          "Please read this section carefully. It affects your legal rights, including your right to sue in court and your right to a jury trial.",
        ),
      ),
      clause(
        "11.1",
        "Applicability.",
        " Except as described below, you and Init agree to resolve all disputes arising out of or relating to the Site, its services, or these Terms through binding individual arbitration – not in court. Exceptions include: (i) claims that qualify for small claims court, brought on an individual basis; and (ii) requests for equitable relief related to intellectual property (such as trademarks, trade secrets, or copyrights). This arbitration agreement applies to all claims, including those that arose before you agreed to these Terms.",
      ),
      clause(
        "11.2",
        "Try to Resolve First.",
        ' Before starting arbitration, the parties agree to try to resolve the dispute informally. The party raising the dispute must send written notice (an "Informal Notice") to the other party. Within 45 days of receiving that Informal Notice, the parties will meet by phone or video in good faith to try to work things out. Our notice address is ',
        email,
        ". If the informal dispute resolution process doesn't resolve the dispute within 60 days, either party may start arbitration.",
      ),
      clause(
        "11.3",
        "Arbitration Rules.",
        " Arbitrations will be administered by JAMS (",
        link("www.jamsadr.com", "https://www.jamsadr.com"),
        "). Claims under $250,000 (excluding fees and interest) will use JAMS' Streamlined Arbitration Rules; larger claims will use JAMS' Comprehensive Arbitration Rules. Unless the parties agree otherwise, arbitration will be conducted in the county where you live. All arbitration materials and documents are confidential.",
      ),
      clause(
        "11.4",
        "Arbitration Request.",
        " The arbitration request must include: (i) your contact information and the email address you use with the Site (if applicable); (ii) a description of the claims and supporting facts; (iii) the relief you're seeking and a good-faith damages estimate; (iv) confirmation that you completed the informal resolution process; and (v) proof of any required filing fee payment.",
      ),
      clause(
        "11.5",
        "Authority of Arbitrator.",
        " The arbitrator has authority to resolve all arbitrable disputes, including questions about the scope and enforceability of this arbitration agreement – except that courts (not arbitrators) will decide: (i) challenges to the class action waiver below; (ii) disputes about arbitration fees; (iii) whether a condition precedent to arbitration has been satisfied; and (iv) which version of this agreement applies. The arbitrator may award the same relief as a court, but on an individual basis only. The arbitrator's award is final and binding, and judgment may be entered in any court with jurisdiction.",
      ),
      clause(
        "11.6",
        "Waiver of Jury Trial.",
        " BY AGREEING TO ARBITRATION, YOU AND INIT WAIVE THE RIGHT TO A TRIAL BY JUDGE OR JURY FOR ALL COVERED CLAIMS.",
      ),
      clause(
        "11.7",
        "Waiver of Class Actions.",
        " ALL DISPUTES MUST BE BROUGHT ON AN INDIVIDUAL BASIS. NEITHER YOU NOR INIT MAY BRING CLAIMS AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, REPRESENTATIVE, OR COLLECTIVE PROCEEDING. The arbitrator may only award relief on an individual basis. If a court finds this class action waiver unenforceable as to a specific claim, that claim may be litigated in state or federal court in San Francisco County, California; all other claims remain subject to arbitration.",
      ),
      clause(
        "11.8",
        "Attorneys' Fees.",
        " Each party bears its own attorneys' fees unless the arbitrator finds a claim was frivolous or brought for an improper purpose.",
      ),
      clause(
        "11.9",
        "Batch Arbitration.",
        " If 100 or more substantially similar arbitration demands are filed against Init within a 30-day period by the same law firm or coordinated group, JAMS will batch them into groups of 100 and appoint one arbitrator per batch, with one set of fees per batch.",
      ),
      clause(
        "11.10",
        "Opt-Out.",
        " You may opt out of this arbitration agreement within 30 days of first accepting these Terms by sending written notice to ",
        email,
        ". Your notice must include your name, the email address you use with the Site, and a clear statement that you wish to opt out. Opting out does not affect any other part of these Terms.",
      ),
      clause(
        "11.11",
        "Severability.",
        " If any part of this arbitration agreement is found invalid, it will be modified to the minimum extent necessary to make it enforceable; the rest of the agreement remains in effect.",
      ),
    ),
  ],
  title: "Terms of Use",
};
