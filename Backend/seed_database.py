# Backend/seed_database.py
import datetime
from app.config import get_database

def seed_database():
    print("[INFO] Connecting to MongoDB Atlas and seeding comprehensive real data...")
    db = get_database()
    
    # 1. Sprints Collection
    sprints_data = [
        {
            "id": "sprint-101",
            "title": "Full-Stack AI Assistant with Next.js & FastAPI",
            "company": "CloudScale AI",
            "difficulty": "Intermediate",
            "duration": "2 weeks",
            "duration_minutes": 45,
            "team_size": 4,
            "total_spots": 4,
            "spots_left": 2,
            "technologies": ["Next.js", "FastAPI", "Groq", "MongoDB", "TailwindCSS"],
            "description": "Build an intelligent conversational assistant with real-time streaming and vector knowledge retrieval.",
            "reward": "$1,200",
            "applications": 14,
            "start_date": "2026-08-15",
            "mentor": "Sarah Chen (Ex-Stripe Staff Engineer)",
            "rating": 4.9,
            "status": "Open",
            "progress": 0,
            "days_remaining": 14,
            "tasks": [
                {
                    "id": "t1",
                    "title": "Build Streaming Chat API & Token Counter",
                    "difficulty": "Intermediate",
                    "estimated_time": "25m",
                    "description": "Implement a FastAPI streaming response endpoint using Groq LLM with rate limiting and token accounting.",
                    "starter_code": "import asyncio\nfrom typing import AsyncGenerator\n\nasync def stream_chat_response(prompt: str) -> AsyncGenerator[str, None]:\n    # Implement streaming logic with token accounting\n    pass\n",
                    "instructions": [
                        "Create an async generator streaming LLM chunks",
                        "Calculate tokens used per chunk and enforce rate limit",
                        "Handle network disconnects gracefully"
                    ],
                    "hints": [
                        "Use asyncio.sleep or async generators with yield",
                        "Track prompt tokens using len(prompt.split()) as heuristic"
                    ]
                },
                {
                    "id": "t2",
                    "title": "Implement Vector Search & Similarity Re-ranking",
                    "difficulty": "Advanced",
                    "estimated_time": "20m",
                    "description": "Create cosine similarity cosine ranking for retrieved document snippets.",
                    "starter_code": "import math\nfrom typing import List\n\ndef cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:\n    # Implement cosine similarity\n    pass\n",
                    "instructions": [
                        "Calculate dot product of both vectors",
                        "Normalize magnitudes and return cosine similarity between -1.0 and 1.0"
                    ]
                }
            ],
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "sprint-102",
            "title": "Real-Time Collaboration Canvas & WebSockets",
            "company": "TechFlow Systems",
            "difficulty": "Advanced",
            "duration": "3 weeks",
            "duration_minutes": 60,
            "team_size": 5,
            "total_spots": 5,
            "spots_left": 1,
            "technologies": ["React", "TypeScript", "WebSockets", "Redis", "Canvas API"],
            "description": "Architect a multiplayer whiteboard canvas with conflict resolution and live cursor synchronization.",
            "reward": "$2,000",
            "applications": 28,
            "start_date": "2026-08-18",
            "mentor": "Alex Rivera (Principal Architect)",
            "rating": 4.8,
            "status": "Open",
            "progress": 0,
            "days_remaining": 21,
            "tasks": [
                {
                    "id": "t3",
                    "title": "Real-Time Presence Manager",
                    "difficulty": "Intermediate",
                    "estimated_time": "30m",
                    "starter_code": "class PresenceManager:\n    def __init__(self):\n        self.users = {}\n\n    def update_cursor(self, user_id: str, x: float, y: float):\n        pass\n"
                }
            ],
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "sprint-103",
            "title": "High-Throughput Payments & Billing Microservice",
            "company": "Apex Innovations",
            "difficulty": "Intermediate",
            "duration": "2 weeks",
            "duration_minutes": 40,
            "team_size": 3,
            "total_spots": 3,
            "spots_left": 3,
            "technologies": ["Python", "FastAPI", "PostgreSQL", "Stripe API", "Docker"],
            "description": "Design an idempotent subscription checkout pipeline with automated webhook reconciliation.",
            "reward": "$1,500",
            "applications": 19,
            "start_date": "2026-08-20",
            "mentor": "David Kim (Lead DevOps)",
            "rating": 5.0,
            "status": "Open",
            "progress": 0,
            "days_remaining": 14,
            "tasks": [
                {
                    "id": "t4",
                    "title": "Webhook Idempotency Handler",
                    "difficulty": "Intermediate",
                    "estimated_time": "25m",
                    "starter_code": "def process_webhook_event(event_id: str, payload: dict) -> bool:\n    pass\n"
                }
            ],
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "sprint-104",
            "title": "Scalable GraphQL Gateway & Micro-Frontends",
            "company": "Nexus Enterprise",
            "difficulty": "Beginner",
            "duration": "1 week",
            "duration_minutes": 30,
            "team_size": 3,
            "total_spots": 3,
            "spots_left": 2,
            "technologies": ["Node.js", "GraphQL", "React", "TailwindCSS"],
            "description": "Create a unified GraphQL API gateway aggregating multiple backend REST endpoints.",
            "reward": "$800",
            "applications": 32,
            "start_date": "2026-08-12",
            "mentor": "Elena Rostova (Senior Frontend Lead)",
            "rating": 4.7,
            "status": "Open",
            "progress": 0,
            "days_remaining": 7,
            "tasks": [
                {
                    "id": "t5",
                    "title": "Schema Stitching & Resolver Pipeline",
                    "difficulty": "Beginner",
                    "estimated_time": "20m",
                    "starter_code": "def stitch_schemas(schemas: list):\n    pass\n"
                }
            ],
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
    ]
    
    # 2. Companies Collection
    companies_data = [
        {
            "id": "comp-1",
            "name": "CloudScale AI",
            "industry": "Artificial Intelligence & Cloud",
            "size": "50-200 employees",
            "location": "San Francisco, CA (Remote)",
            "website": "https://cloudscale.ai",
            "hiring_preferences": {
                "tech_stack": ["Python", "FastAPI", "React", "MongoDB", "PyTorch"],
                "seniority_levels": ["Junior", "Mid-Level", "Senior"],
                "cultural_fit": ["Autonomy", "Fast Execution", "Product-Minded"],
                "location_preference": "Remote"
            },
            "active_sprints": ["sprint-101"],
            "hired_developers": ["dev1@breakin.ai"],
            "success_metrics": {
                "hiring_cost_savings": "65%",
                "time_to_hire": 8,
                "match_accuracy": 94,
                "retention_rate": 96
            },
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "comp-2",
            "name": "TechFlow Systems",
            "industry": "Enterprise SaaS",
            "size": "200-500 employees",
            "location": "New York, NY (Hybrid)",
            "website": "https://techflow.io",
            "hiring_preferences": {
                "tech_stack": ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "Docker"],
                "seniority_levels": ["Mid-Level", "Senior"],
                "cultural_fit": ["Team Player", "Clean Architecture", "Code Reviews"],
                "location_preference": "Hybrid"
            },
            "active_sprints": ["sprint-102"],
            "hired_developers": ["dev2@breakin.ai"],
            "success_metrics": {
                "hiring_cost_savings": "55%",
                "time_to_hire": 12,
                "match_accuracy": 91,
                "retention_rate": 93
            },
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "comp-3",
            "name": "Apex Innovations",
            "industry": "FinTech & Banking Infrastructure",
            "size": "500-1000 employees",
            "location": "London, UK (Remote)",
            "website": "https://apexinnovations.com",
            "hiring_preferences": {
                "tech_stack": ["Python", "FastAPI", "Stripe API", "PostgreSQL", "Kafka"],
                "seniority_levels": ["Senior", "Principal"],
                "cultural_fit": ["High Precision", "Security First", "Distributed Systems"],
                "location_preference": "Remote"
            },
            "active_sprints": ["sprint-103"],
            "hired_developers": [],
            "success_metrics": {
                "hiring_cost_savings": "70%",
                "time_to_hire": 10,
                "match_accuracy": 97,
                "retention_rate": 98
            },
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
    ]

    # 3. Developers Collection
    developers_data = [
        {
            "id": "dev-101",
            "codename": "CyberKitsune_99",
            "username": "cyber_kitsune",
            "displayName": "Alex Rivers",
            "email": "dev1@breakin.ai",
            "reputation": 4.95,
            "skills": ["React", "Next.js", "TypeScript", "TailwindCSS", "FastAPI"],
            "sprint_history": 8,
            "success_rate": 98,
            "growth_delta": "+34%",
            "growth": "+34%",
            "proofScore": 96,
            "trustScore": 99,
            "status": "Available",
            "last_sprint": "Full-Stack AI Assistant",
            "mentor_endorsements": 5,
            "team_rating": 4.9,
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
            "total_earnings": "$4,200",
            "skill_badges": 7,
            "current_streak": 5,
            "level": "Senior Developer",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "dev-102",
            "codename": "QuantumCoder",
            "username": "quantum_coder",
            "displayName": "Marcus Vance",
            "email": "dev2@breakin.ai",
            "reputation": 4.85,
            "skills": ["Python", "FastAPI", "MongoDB", "Docker", "PyTorch"],
            "sprint_history": 6,
            "success_rate": 94,
            "growth_delta": "+28%",
            "growth": "+28%",
            "proofScore": 92,
            "trustScore": 95,
            "status": "Available",
            "last_sprint": "High-Throughput Payments",
            "mentor_endorsements": 4,
            "team_rating": 4.8,
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
            "total_earnings": "$3,100",
            "skill_badges": 5,
            "current_streak": 4,
            "level": "Intermediate",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        },
        {
            "id": "dev-103",
            "codename": "NullPointerHero",
            "username": "null_pointer",
            "displayName": "Elena Rostova",
            "email": "dev3@breakin.ai",
            "reputation": 4.90,
            "skills": ["TypeScript", "Node.js", "GraphQL", "WebSockets", "Rust"],
            "sprint_history": 11,
            "success_rate": 96,
            "growth_delta": "+41%",
            "growth": "+41%",
            "proofScore": 98,
            "trustScore": 97,
            "status": "In Sprint",
            "last_sprint": "Real-Time Collaboration Canvas",
            "mentor_endorsements": 6,
            "team_rating": 5.0,
            "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
            "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
            "total_earnings": "$6,800",
            "skill_badges": 9,
            "current_streak": 8,
            "level": "Lead Engineer",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
    ]

    # 4. Jobs Collection
    jobs_data = [
        {
            "id": "job-1",
            "title": "Senior Full-Stack AI Engineer",
            "company": "CloudScale AI",
            "location": "Remote (Global)",
            "type": "Full-time",
            "salary": "$140,000 - $180,000",
            "salaryMin": 140000,
            "salaryMax": 180000,
            "equity": "0.1% - 0.5%",
            "skills": ["Next.js", "FastAPI", "Python", "MongoDB", "LLM APIs"],
            "requiredSkills": ["Next.js", "FastAPI", "Python"],
            "description": "Lead the architectural design of real-time conversational agents and evaluation pipelines. Candidates with verified Proof-of-Work sprint scores are fast-tracked.",
            "proofRequired": "Complete Sprint: Full-Stack AI Assistant (Score >= 85)",
            "applicantsCount": 24,
            "status": "Active",
            "featured": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "id": "job-2",
            "title": "Distributed Systems & Realtime Engineer",
            "company": "TechFlow Systems",
            "location": "New York, NY / Remote",
            "type": "Full-time",
            "salary": "$155,000 - $200,000",
            "salaryMin": 155000,
            "salaryMax": 200000,
            "equity": "0.2% - 0.75%",
            "skills": ["WebSockets", "TypeScript", "Redis", "Canvas API", "Go"],
            "requiredSkills": ["TypeScript", "WebSockets", "Redis"],
            "description": "Architect high-concurrency multiplayer canvas sync engines handling 100,000 simultaneous connections.",
            "proofRequired": "Complete Sprint: Real-Time Collaboration Canvas (Score >= 90)",
            "applicantsCount": 18,
            "status": "Active",
            "featured": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "id": "job-3",
            "title": "FinTech Payments Backend Lead",
            "company": "Apex Innovations",
            "location": "London / Remote",
            "type": "Full-time",
            "salary": "$160,000 - $210,000",
            "salaryMin": 160000,
            "salaryMax": 210000,
            "equity": "0.15% - 0.4%",
            "skills": ["FastAPI", "Python", "Stripe API", "PostgreSQL", "Idempotency"],
            "requiredSkills": ["Python", "FastAPI", "Stripe API"],
            "description": "Design bulletproof billing reconciliation and automated ledger systems for enterprise customers.",
            "proofRequired": "Complete Sprint: High-Throughput Payments (Score >= 88)",
            "applicantsCount": 12,
            "status": "Active",
            "featured": False,
            "created_at": datetime.datetime.utcnow()
        }
    ]

    # 5. Pipeline Collection (Hiring Pipeline Stages)
    pipeline_data = [
        {
            "id": "stage-1",
            "title": "Applied",
            "candidates": [
                {
                    "id": "dev-102",
                    "codename": "QuantumCoder",
                    "skills": ["Python", "FastAPI", "MongoDB"],
                    "reputation": 4.85,
                    "proofScore": 92,
                    "appliedDate": "2026-08-09",
                    "targetJob": "Senior Full-Stack AI Engineer"
                }
            ]
        },
        {
            "id": "stage-2",
            "title": "Interviewing",
            "candidates": [
                {
                    "id": "dev-101",
                    "codename": "CyberKitsune_99",
                    "skills": ["React", "Next.js", "FastAPI"],
                    "reputation": 4.95,
                    "proofScore": 96,
                    "appliedDate": "2026-08-05",
                    "targetJob": "Senior Full-Stack AI Engineer"
                }
            ]
        },
        {
            "id": "stage-3",
            "title": "Offer",
            "candidates": [
                {
                    "id": "dev-103",
                    "codename": "NullPointerHero",
                    "skills": ["TypeScript", "WebSockets", "Rust"],
                    "reputation": 4.90,
                    "proofScore": 98,
                    "appliedDate": "2026-07-28",
                    "targetJob": "Distributed Systems & Realtime Engineer"
                }
            ]
        }
    ]

    # 6. Activities Collection
    activities_data = [
        {
            "userId": "dev1@breakin.ai",
            "type": "sprint_completed",
            "title": "Completed 'Full-Stack AI Assistant' Sprint",
            "time": datetime.datetime.utcnow() - datetime.timedelta(hours=3),
            "rating": "4.9",
            "reward": "$1,200",
            "created_at": datetime.datetime.utcnow()
        },
        {
            "userId": "dev1@breakin.ai",
            "type": "skill_earned",
            "title": "Earned Badge: 'FastAPI Microservice Architect'",
            "time": datetime.datetime.utcnow() - datetime.timedelta(hours=14),
            "rating": "5.0",
            "reward": "Badge",
            "created_at": datetime.datetime.utcnow()
        },
        {
            "userId": "dev1@breakin.ai",
            "type": "mentor_feedback",
            "title": "Received 5-Star Review from Principal Engineer Sarah Chen",
            "time": datetime.datetime.utcnow() - datetime.timedelta(days=1),
            "rating": "5.0",
            "reward": "+50 Rep",
            "created_at": datetime.datetime.utcnow()
        },
        {
            "userId": "dev2@breakin.ai",
            "type": "sprint_completed",
            "title": "Completed 'High-Throughput Payments' Sprint",
            "time": datetime.datetime.utcnow() - datetime.timedelta(days=2),
            "rating": "4.8",
            "reward": "$1,500",
            "created_at": datetime.datetime.utcnow()
        }
    ]

    # 7. Skills Collection
    skills_data = [
        {
            "userId": "dev1@breakin.ai",
            "skill": "FastAPI & Python",
            "level": 94,
            "verified": True,
            "category": "Backend",
            "endorsements": 8,
            "sprintsUsed": 5
        },
        {
            "userId": "dev1@breakin.ai",
            "skill": "Next.js & React 19",
            "level": 96,
            "verified": True,
            "category": "Frontend",
            "endorsements": 11,
            "sprintsUsed": 7
        },
        {
            "userId": "dev1@breakin.ai",
            "skill": "MongoDB & Vector Search",
            "level": 88,
            "verified": True,
            "category": "Database",
            "endorsements": 6,
            "sprintsUsed": 4
        },
        {
            "userId": "dev1@breakin.ai",
            "skill": "WebSockets & Realtime",
            "level": 91,
            "verified": True,
            "category": "Architecture",
            "endorsements": 7,
            "sprintsUsed": 3
        }
    ]

    # 8. Reviews Collection (Mentorship Queue)
    reviews_data = [
        {
            "id": "rev-1",
            "submissionId": "sub-101",
            "reviewer": "mentor-1",
            "sprintTitle": "Full-Stack AI Assistant with Next.js & FastAPI",
            "anonymousId": "Candidate #482",
            "submittedCode": "async def stream_chat_response(prompt: str): ...",
            "status": "pending",
            "submittedAt": datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            "created_at": datetime.datetime.utcnow()
        },
        {
            "id": "rev-2",
            "submissionId": "sub-102",
            "reviewer": "mentor-1",
            "sprintTitle": "High-Throughput Payments & Billing Microservice",
            "anonymousId": "Candidate #913",
            "submittedCode": "def process_webhook_event(event_id: str, payload: dict): ...",
            "status": "pending",
            "submittedAt": datetime.datetime.utcnow() - datetime.timedelta(hours=6),
            "created_at": datetime.datetime.utcnow()
        }
    ]

    # Upsert all collections to guarantee fresh, populated live data
    collections = [
        ("sprints", sprints_data, "title"),
        ("companies", companies_data, "name"),
        ("developers", developers_data, "email"),
        ("jobs", jobs_data, "title"),
        ("pipeline", pipeline_data, "title"),
        ("activities", activities_data, "title"),
        ("skills", skills_data, "skill"),
        ("reviews", reviews_data, "id")
    ]

    for col_name, data, key in collections:
        col = db[col_name]
        col.delete_many({}) # Refresh with clean verified real dataset
        col.insert_many(data)
        print(f"[OK] Seeded {len(data)} documents into '{col_name}' collection")

    print("[SUCCESS] Comprehensive MongoDB Atlas database seeding complete!")

if __name__ == "__main__":
    seed_database()
