/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, useClerk } from "@clerk/nextjs";
import ContentCard from "@/components/ContentCard";
import { useFirebaseAuthStatus } from "@/components/FirebaseAuthProvider";
import { FullPageLoadingIndicator } from "@/components/layout/FullPageLoadingIndicator";

interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function ArticlesPage() {
  const { userId } = useAuth();
  const { isAuthenticated } = useFirebaseAuthStatus();
  const clerk = useClerk();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    if (!userId) {
      console.log("請先登入");
      clerk.redirectToSignIn();
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    const userContentRef = collection(db, "content", userId, "articles");
    const q = query(userContentRef, where("userId", "==", userId));

    try {
      const querySnapshot = await getDocs(q);
      const articlesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Article[];

      articlesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setArticles(articlesList);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteSuccess = () => {
    fetchArticles();
  };
  useEffect(() => {
    fetchArticles();
  }, [clerk, userId, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <FullPageLoadingIndicator />;
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">未找到文章，匯入文章以開始！</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-48">
      {articles.map((article) => (
        <ContentCard
          key={article.id}
          contentType="articles"
          id={article.id}
          title={article.title}
          content={article.content}
          createdAt={article.createdAt}
          onDeleteSuccess={onDeleteSuccess}
        />
      ))}
    </div>
  );
}
