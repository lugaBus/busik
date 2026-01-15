'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { contentCreatorsApi, ContentCreator, CreateContentCreatorDto } from '@/api/contentCreators';
import { categoriesApi, Category } from '@/api/categories';
import { tagsApi, Tag } from '@/api/tags';
import { ratiosApi, Ratio } from '@/api/ratios';
import { platformsApi, Platform, contentCreatorPlatformsApi, ContentCreatorPlatform, CreateContentCreatorPlatformDto } from '@/api/platforms';
import { piterTestProofsApi, PiterTestProof, CreatePiterTestProofDto } from '@/api/piterTestProofs';
import { proofsApi, Proof, CreateProofDto } from '@/api/proofs';
import { proofSubmissionsApi, ProofSubmission, UpdateProofSubmissionStatusDto } from '@/api/proofSubmissions';
import { authService } from '@/auth/auth.service';
import { createI18nText, getI18nText, I18nText, Language } from '@/utils/i18n';

export default function ContentCreatorFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Early redirect if id is 'submissions' - use useLayoutEffect for immediate redirect
  useLayoutEffect(() => {
    if (id === 'submissions') {
      router.replace('/content-creators/submissions');
    }
  }, [id, router]);
  
  // Early return if this is submissions route - prevent any rendering or API calls
  if (id === 'submissions') {
    return null;
  }
  
  const isEdit = id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ratios, setRatios] = useState<Ratio[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [contentCreatorPlatforms, setContentCreatorPlatforms] = useState<ContentCreatorPlatform[]>([]);
  const [piterTestProofs, setPiterTestProofs] = useState<PiterTestProof[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [proofSubmissions, setProofSubmissions] = useState<ProofSubmission[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [initialPhotoUrls, setInitialPhotoUrls] = useState<string[]>([]);
  const [initialProofs, setInitialProofs] = useState<Proof[]>([]);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [editLanguage, setEditLanguage] = useState<Language>('ua');
  const [showProofModal, setShowProofModal] = useState(false);
  const [editingProofId, setEditingProofId] = useState<string | null>(null);
  const [proofForm, setProofForm] = useState({ url: '', imageUrl: '', description: createI18nText() });
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [uploadingProofImage, setUploadingProofImage] = useState(false);
  const [removeProofImage, setRemoveProofImage] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showPiterTestProofModal, setShowPiterTestProofModal] = useState(false);
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [editingPiterTestProofId, setEditingPiterTestProofId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: createI18nText(), description: createI18nText() });
  const [tagForm, setTagForm] = useState({ name: createI18nText(), description: createI18nText() });
  const [ratioForm, setRatioForm] = useState({ name: createI18nText(), description: createI18nText() });
  const [platformForm, setPlatformForm] = useState({ platformId: '', url: '', description: createI18nText() });
  const [piterTestProofForm, setPiterTestProofForm] = useState({ url: '', imageUrl: '', description: createI18nText() });
  const [piterTestProofImageFile, setPiterTestProofImageFile] = useState<File | null>(null);
  const [uploadingPiterTestProofImage, setUploadingPiterTestProofImage] = useState(false);
  const [removePiterTestProofImage, setRemovePiterTestProofImage] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [savingRatio, setSavingRatio] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [savingPiterTestProof, setSavingPiterTestProof] = useState(false);
  const [jsonErrors, setJsonErrors] = useState<{ audience?: string; metrics?: string }>({});
  const [jsonTexts, setJsonTexts] = useState<{ audience?: string; metrics?: string }>({});
  const [initialFormData, setInitialFormData] = useState<CreateContentCreatorDto | null>(null);
  const [formData, setFormData] = useState<CreateContentCreatorDto>({
    name: createI18nText(),
    quote: createI18nText(),
    description: createI18nText(),
    locale: 'uk-UA',
    mainLink: '',
    rating: undefined,
    categoryIds: [],
    tagIds: [],
    ratioId: undefined,
    contentFormats: [],
    tone: 0,
    piterTest: undefined,
    status: 'active',
  });

  // Early redirect if id is 'submissions' - use useLayoutEffect for immediate redirect
  useLayoutEffect(() => {
    if (id === 'submissions') {
      router.replace('/content-creators/submissions');
    }
  }, [id, router]);

  useEffect(() => {
    // Don't proceed if this is the submissions route
    if (id === 'submissions') {
      return;
    }
    
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Initialize JSON text fields for new creator
    if (!isEdit) {
      setJsonTexts({
        audience: '{}',
        metrics: '{}',
      });
      const initialData: CreateContentCreatorDto = {
        name: createI18nText(),
        quote: createI18nText(),
        description: createI18nText(),
        locale: 'uk-UA',
        mainLink: '',
        rating: undefined,
        categoryIds: [],
        tagIds: [],
        ratioId: undefined,
        contentFormats: [],
        tone: 0,
        piterTest: undefined,
        status: 'active',
      };
      setInitialFormData(initialData);
      setInitialPhotoUrls([]);
      setInitialProofs([]);
    }

    // Don't load anything if this is the submissions route
    if (id === 'submissions') {
      return;
    }
    
    loadCategoriesAndTags();
    if (isEdit && id !== 'submissions') {
      loadCreator();
    }
  }, [router, id]);

  // Function to check if form has changes
  const hasChanges = (): boolean => {
    if (!initialFormData) return false;
    
    // Deep comparison function
    const deepEqual = (obj1: any, obj2: any): boolean => {
      if (obj1 === obj2) return true;
      if (obj1 == null || obj2 == null) return false;
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
          if (obj1[key].length !== obj2[key].length) return false;
          // Sort arrays before comparison for order-independent comparison
          const sorted1 = [...obj1[key]].sort();
          const sorted2 = [...obj2[key]].sort();
          if (!sorted1.every((val: any, idx: number) => val === sorted2[idx])) return false;
        } else if (!deepEqual(obj1[key], obj2[key])) {
          return false;
        }
      }
      
      return true;
    };
    
    // Check formData changes
    const formDataChanged = !deepEqual(formData, initialFormData);
    
    // Check photoUrls changes
    const photoUrlsChanged = JSON.stringify([...photoUrls].sort()) !== JSON.stringify([...initialPhotoUrls].sort());
    
    // Check proofs changes (compare by id and content)
    const proofsChanged = (() => {
      if (proofs.length !== initialProofs.length) return true;
      const initialProofsMap = new Map(initialProofs.map(p => [p.id, p]));
      for (const proof of proofs) {
        const initialProof = initialProofsMap.get(proof.id);
        if (!initialProof) return true; // New proof
        // Compare proof properties
        if (proof.url !== initialProof.url || 
            proof.imageUrl !== initialProof.imageUrl ||
            JSON.stringify(proof.description) !== JSON.stringify(initialProof.description)) {
          return true;
        }
      }
      return false;
    })();
    
    return formDataChanged || photoUrlsChanged || proofsChanged;
  };

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, initialFormData]);

  // Handle navigation with confirmation
  const handleNavigation = (path: string) => {
    if (hasChanges()) {
      if (!confirm('У вас есть несохраненные изменения. Вы уверены, что хотите уйти? Все несохраненные данные будут утеряны.')) {
        return;
      }
    }
    router.push(path);
  };

  const loadCategoriesAndTags = async () => {
    try {
      const [cats, tgs, rts, plts] = await Promise.all([
        categoriesApi.getAll(),
        tagsApi.getAll(),
        ratiosApi.getAll(),
        platformsApi.getAll(),
      ]);
      setCategories(cats);
      setTags(tgs);
      setRatios(rts);
      setPlatforms(plts);
    } catch (error) {
      console.error('Failed to load categories/tags/ratios/platforms:', error);
    }
  };

  const loadCreator = async () => {
    // Don't load if this is the submissions route
    if (id === 'submissions') {
      router.replace('/content-creators/submissions');
      return;
    }
    try {
      setLoading(true);
      const creator = await contentCreatorsApi.getById(id);
      const initialData: CreateContentCreatorDto = {
        name: creator.name,
        quote: creator.quote || createI18nText(),
        description: creator.description || createI18nText(),
        locale: creator.locale,
        mainLink: creator.mainLink || '',
        rating: creator.rating,
        categoryIds: creator.categories?.map((c) => c.id) || [],
        tagIds: creator.tags?.map((t) => t.id) || [],
        ratioId: creator.ratios && creator.ratios.length > 0 ? creator.ratios[0].id : undefined,
        contentFormats: creator.contentFormats || [],
        tone: creator.tone ?? 0,
        audience: creator.audience,
        metrics: creator.metrics,
        piterTest: creator.piterTest,
        status: creator.status,
      };
      setFormData(initialData);
      setInitialFormData(initialData);
      setJsonErrors({}); // Reset JSON errors when loading data
      // Initialize JSON text fields
      setJsonTexts({
        audience: creator.audience ? JSON.stringify(creator.audience, null, 2) : '{}',
        metrics: creator.metrics ? JSON.stringify(creator.metrics, null, 2) : '{}',
      });
      const loadedPhotoUrls = creator.photoUrls || [];
      setPhotoUrls(loadedPhotoUrls);
      setInitialPhotoUrls([...loadedPhotoUrls]);
      if (isEdit) {
        const [proofsData, platformsData, piterTestProofsData, proofSubmissionsData] = await Promise.all([
          proofsApi.getByCreator(id),
          contentCreatorPlatformsApi.getByCreator(id),
          piterTestProofsApi.getByCreator(id),
          proofSubmissionsApi.getByCreator(id),
        ]);
        setProofs(proofsData);
        setInitialProofs([...proofsData]);
        setContentCreatorPlatforms(platformsData);
        setPiterTestProofs(piterTestProofsData);
        setProofSubmissions(proofSubmissionsData);
      }
    } catch (error) {
      console.error('Failed to load creator:', error);
      alert('Failed to load content creator');
      router.push('/content-creators');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      alert('Please select a valid image file (jpg, jpeg, png, gif, webp)');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    if (photoUrls.length >= 4) {
      alert('Maximum 4 photos allowed');
      e.target.value = '';
      return;
    }

    if (isEdit || createdId) {
      // Если уже создан, загружаем сразу
      handlePhotoUpload(file, isEdit ? id : createdId!);
    } else {
      alert('Please save the content creator first');
      e.target.value = '';
    }
    e.target.value = '';
  };

  const handlePhotoUpload = async (file: File, creatorId: string) => {
    try {
      setUploadingPhotoIndex(photoUrls.length);
      const updated = await contentCreatorsApi.addPhoto(creatorId, file);
      setPhotoUrls(updated.photoUrls || []);
      alert('Photo uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      alert(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  const handlePhotoRemove = async (photoIndex: number) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    if (!isEdit || !id || id === 'new') return;
    
    try {
      await contentCreatorsApi.removePhoto(id, photoIndex);
      setPhotoUrls(photoUrls.filter((_, i) => i !== photoIndex));
      alert('Photo removed successfully');
    } catch (error: any) {
      console.error('Failed to remove photo:', error);
      alert(error.response?.data?.message || 'Failed to remove photo');
    }
  };

  const handleAddProof = () => {
    if (!isEdit || !id || id === 'new') {
      alert('Please save the content creator first');
      return;
    }
    setEditingProofId(null);
    setShowProofModal(true);
    setProofForm({ url: '', imageUrl: '', description: createI18nText() });
    setProofImageFile(null);
    setRemoveProofImage(false);
  };

  const handleEditProof = async (proofId: string) => {
    try {
      const proof = await proofsApi.getById(proofId);
      setEditingProofId(proofId);
      setShowProofModal(true);
      setProofForm({
        url: proof.url || '',
        imageUrl: proof.imageUrl || '',
        description: proof.description || createI18nText(),
      });
      setProofImageFile(null);
      setRemoveProofImage(false);
    } catch (error: any) {
      console.error('Failed to load proof:', error);
      alert(error.response?.data?.message || 'Failed to load proof');
    }
  };

  const handleProofImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      alert('Please select a valid image file (jpg, jpeg, png, gif, webp)');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setProofImageFile(file);
    setRemoveProofImage(false); // Сбрасываем флаг удаления при выборе нового файла
    e.target.value = '';
  };

  const handleSubmitProof = async () => {
    if (!isEdit || !id || id === 'new') return;
    
    try {
      if (editingProofId) {
        // Редактирование существующего proof
        const updateData: any = {
          url: proofForm.url || undefined,
          description: proofForm.description,
        };

        // Если нужно удалить изображение
        if (removeProofImage) {
          updateData.imageUrl = null;
        } else if (!proofImageFile && proofForm.imageUrl) {
          // Сохраняем текущее изображение, если не выбрано новое и не удалено
          updateData.imageUrl = proofForm.imageUrl;
        } else if (!proofImageFile && !proofForm.imageUrl) {
          // Если нет изображения, не передаем imageUrl
          updateData.imageUrl = undefined;
        }

        // Обновляем proof
        let updatedProof = await proofsApi.update(editingProofId, updateData);

        // Если был выбран новый файл изображения, загружаем его
        if (proofImageFile) {
          setUploadingProofImage(true);
          try {
            updatedProof = await proofsApi.uploadImage(editingProofId, proofImageFile);
          } catch (error: any) {
            console.error('Failed to upload proof image:', error);
            alert('Proof updated but failed to upload image: ' + (error.response?.data?.message || 'Unknown error'));
          } finally {
            setUploadingProofImage(false);
          }
        }

        // Обновляем список proofs
        setProofs(proofs.map(p => p.id === editingProofId ? updatedProof : p));
      } else {
        // Создание нового proof
        const newProof = await proofsApi.create(id, {
          url: proofForm.url || undefined,
          imageUrl: proofForm.imageUrl || undefined,
          description: proofForm.description,
        });

        // Если был выбран файл изображения, загружаем его
        if (proofImageFile) {
          setUploadingProofImage(true);
          try {
            const updated = await proofsApi.uploadImage(newProof.id, proofImageFile);
            setProofs([...proofs, updated]);
          } catch (error: any) {
            console.error('Failed to upload proof image:', error);
            alert('Proof created but failed to upload image: ' + (error.response?.data?.message || 'Unknown error'));
            setProofs([...proofs, newProof]);
          } finally {
            setUploadingProofImage(false);
          }
        } else {
          setProofs([...proofs, newProof]);
        }
      }

      setShowProofModal(false);
      setEditingProofId(null);
      setProofForm({ url: '', imageUrl: '', description: createI18nText() });
      setProofImageFile(null);
      setRemoveProofImage(false);
    } catch (error: any) {
      console.error('Failed to save proof:', error);
      alert(error.response?.data?.message || 'Failed to save proof');
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm('Are you sure you want to delete this proof?')) return;
    try {
      await proofsApi.delete(proofId);
      setProofs(proofs.filter(p => p.id !== proofId));
    } catch (error: any) {
      console.error('Failed to delete proof:', error);
      alert(error.response?.data?.message || 'Failed to delete proof');
    }
  };

  const handleUpdateProofSubmissionStatus = async (proofSubmissionId: string, status: 'submitted' | 'in_review' | 'accepted' | 'declined') => {
    if (!isEdit || !id || id === 'new') return;
    
    try {
      const updated = await proofSubmissionsApi.updateStatus(id, proofSubmissionId, { status });
      setProofSubmissions(proofSubmissions.map(s => s.id === proofSubmissionId ? updated : s));
      
      // If accepted, reload proofs to show the newly added proof
      if (status === 'accepted') {
        const updatedProofs = await proofsApi.getByCreator(id);
        setProofs(updatedProofs);
        setInitialProofs([...updatedProofs]);
      }
      
      alert(`Proof submission status updated to ${status}`);
    } catch (error: any) {
      console.error('Failed to update proof submission status:', error);
      alert(error.response?.data?.message || 'Failed to update proof submission status');
    }
  };

  const handleDeleteProofSubmission = async (proofSubmissionId: string) => {
    if (!isEdit || !id || id === 'new') return;
    
    if (!confirm('Are you sure you want to permanently delete this proof submission? This action cannot be undone.')) {
      return;
    }
    
    try {
      await proofSubmissionsApi.delete(id, proofSubmissionId);
      setProofSubmissions(proofSubmissions.filter(s => s.id !== proofSubmissionId));
      alert('Proof submission deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete proof submission:', error);
      alert(error.response?.data?.message || 'Failed to delete proof submission');
    }
  };

  const handleCreateCategory = async () => {
    try {
      setSavingCategory(true);
      const newCategory = await categoriesApi.create({
        name: categoryForm.name,
        description: categoryForm.description,
      });
      setCategories([...categories, newCategory]);
      // Автоматически добавляем в выбранные
      setFormData({
        ...formData,
        categoryIds: [...(formData.categoryIds || []), newCategory.id],
      });
      setShowCategoryModal(false);
      setCategoryForm({ name: createI18nText(), description: createI18nText() });
      alert('Category created and added successfully');
    } catch (error: any) {
      console.error('Failed to create category:', error);
      alert(error.response?.data?.message || 'Failed to create category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCreateTag = async () => {
    try {
      setSavingTag(true);
      const newTag = await tagsApi.create({
        name: tagForm.name,
        description: tagForm.description,
      });
      setTags([...tags, newTag]);
      // Автоматически добавляем в выбранные
      setFormData({
        ...formData,
        tagIds: [...(formData.tagIds || []), newTag.id],
      });
      setShowTagModal(false);
      setTagForm({ name: createI18nText(), description: createI18nText() });
      alert('Tag created and added successfully');
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      alert(error.response?.data?.message || 'Failed to create tag');
    } finally {
      setSavingTag(false);
    }
  };

  const handleCreateRatio = async () => {
    try {
      setSavingRatio(true);
      const newRatio = await ratiosApi.create({
        name: ratioForm.name,
        description: ratioForm.description,
      });
      setRatios([...ratios, newRatio]);
      // Автоматически добавляем в выбранные
      setFormData({
        ...formData,
        ratioId: newRatio.id,
      });
      setShowRatioModal(false);
      setRatioForm({ name: createI18nText(), description: createI18nText() });
      alert('Ratio created and added successfully');
    } catch (error: any) {
      console.error('Failed to create ratio:', error);
      alert(error.response?.data?.message || 'Failed to create ratio');
    } finally {
      setSavingRatio(false);
    }
  };

  const handleAddPlatform = () => {
    if (!isEdit || !id || id === 'new') {
      alert('Please save the content creator first');
      return;
    }
    setEditingPlatformId(null);
    setShowPlatformModal(true);
    setPlatformForm({ platformId: '', url: '', description: createI18nText() });
  };

  const handleEditPlatform = (platform: ContentCreatorPlatform) => {
    setEditingPlatformId(platform.id);
    setShowPlatformModal(true);
    setPlatformForm({
      platformId: platform.platform.id,
      url: platform.url,
      description: platform.description || createI18nText(),
    });
  };

  const handleSubmitPlatform = async () => {
    if (!isEdit || !id || id === 'new') return;
    
    try {
      setSavingPlatform(true);
      if (editingPlatformId) {
        const updated = await contentCreatorPlatformsApi.update(editingPlatformId, {
          url: platformForm.url,
          description: platformForm.description,
        });
        setContentCreatorPlatforms(contentCreatorPlatforms.map(p => p.id === editingPlatformId ? updated : p));
        alert('Platform updated successfully');
      } else {
        const newPlatform = await contentCreatorPlatformsApi.add(id, {
          platformId: platformForm.platformId,
          url: platformForm.url,
          description: platformForm.description,
        });
        setContentCreatorPlatforms([...contentCreatorPlatforms, newPlatform]);
        alert('Platform added successfully');
      }
      setShowPlatformModal(false);
      setEditingPlatformId(null);
      setPlatformForm({ platformId: '', url: '', description: createI18nText() });
    } catch (error: any) {
      console.error('Failed to save platform:', error);
      alert(error.response?.data?.message || 'Failed to save platform');
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleDeletePlatform = async (platformId: string) => {
    if (!confirm('Are you sure you want to remove this platform?')) return;
    try {
      await contentCreatorPlatformsApi.delete(platformId);
      setContentCreatorPlatforms(contentCreatorPlatforms.filter(p => p.id !== platformId));
      alert('Platform removed successfully');
    } catch (error: any) {
      console.error('Failed to remove platform:', error);
      alert(error.response?.data?.message || 'Failed to remove platform');
    }
  };

  const handleAddPiterTestProof = () => {
    if (!isEdit || !id || id === 'new') {
      alert('Please save the content creator first');
      return;
    }
    setEditingPiterTestProofId(null);
    setShowPiterTestProofModal(true);
    setPiterTestProofForm({ url: '', imageUrl: '', description: createI18nText() });
    setPiterTestProofImageFile(null);
    setRemovePiterTestProofImage(false);
  };

  const handleEditPiterTestProof = (proof: PiterTestProof) => {
    setEditingPiterTestProofId(proof.id);
    setShowPiterTestProofModal(true);
    setPiterTestProofForm({
      url: proof.url || '',
      imageUrl: proof.imageUrl || '',
      description: proof.description || createI18nText(),
    });
    setPiterTestProofImageFile(null);
    setRemovePiterTestProofImage(false);
  };

  const handleSubmitPiterTestProof = async () => {
    if (!isEdit || !id || id === 'new') return;
    
    try {
      setSavingPiterTestProof(true);
      let imageUrl = piterTestProofForm.imageUrl;

      // Upload image if file selected
      if (piterTestProofImageFile) {
        if (editingPiterTestProofId) {
          const uploaded = await piterTestProofsApi.uploadImage(editingPiterTestProofId, piterTestProofImageFile);
          imageUrl = uploaded.imageUrl || '';
        } else {
          // For new proof, we'll upload after creation
        }
      }

      // Remove image if requested
      if (removePiterTestProofImage && editingPiterTestProofId) {
        imageUrl = '';
      }

      if (editingPiterTestProofId) {
        const updated = await piterTestProofsApi.update(editingPiterTestProofId, {
          url: piterTestProofForm.url,
          imageUrl: removePiterTestProofImage ? '' : imageUrl,
          description: piterTestProofForm.description,
        });
        setPiterTestProofs(piterTestProofs.map(p => p.id === editingPiterTestProofId ? updated : p));
        alert('Piter Test Proof updated successfully');
      } else {
        const newProof = await piterTestProofsApi.add(id, {
          url: piterTestProofForm.url,
          imageUrl: '',
          description: piterTestProofForm.description,
        });
        
        // Upload image if file selected for new proof
        if (piterTestProofImageFile) {
          const uploaded = await piterTestProofsApi.uploadImage(newProof.id, piterTestProofImageFile);
          const finalProof = await piterTestProofsApi.update(newProof.id, { imageUrl: uploaded.imageUrl });
          setPiterTestProofs([...piterTestProofs, finalProof]);
        } else {
          setPiterTestProofs([...piterTestProofs, newProof]);
        }
        alert('Piter Test Proof added successfully');
      }
      setShowPiterTestProofModal(false);
      setEditingPiterTestProofId(null);
      setPiterTestProofForm({ url: '', imageUrl: '', description: createI18nText() });
      setPiterTestProofImageFile(null);
      setRemovePiterTestProofImage(false);
    } catch (error: any) {
      console.error('Failed to save Piter Test Proof:', error);
      alert(error.response?.data?.message || 'Failed to save Piter Test Proof');
    } finally {
      setSavingPiterTestProof(false);
      setUploadingPiterTestProofImage(false);
    }
  };

  const handleDeletePiterTestProof = async (proofId: string) => {
    if (!confirm('Are you sure you want to remove this Piter Test Proof?')) return;
    try {
      await piterTestProofsApi.delete(proofId);
      setPiterTestProofs(piterTestProofs.filter(p => p.id !== proofId));
      alert('Piter Test Proof removed successfully');
    } catch (error: any) {
      console.error('Failed to remove Piter Test Proof:', error);
      alert(error.response?.data?.message || 'Failed to remove Piter Test Proof');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate JSON fields before saving
    const hasJsonErrors = Object.values(jsonErrors).some(error => error !== undefined);
    if (hasJsonErrors) {
      const errorFields = Object.entries(jsonErrors)
        .filter(([_, error]) => error !== undefined)
        .map(([field]) => field)
        .join(', ');
      alert(`Please fix JSON errors in the following fields before saving: ${errorFields}`);
      return;
    }
    
    // Also validate JSON text fields one more time
    const validationErrors: { audience?: string; metrics?: string } = {};
    (['audience', 'metrics'] as const).forEach((field) => {
      const jsonText = jsonTexts[field];
      if (jsonText !== undefined && jsonText.trim() !== '') {
        try {
          JSON.parse(jsonText);
        } catch (err) {
          validationErrors[field] = err instanceof Error ? err.message : 'Invalid JSON';
        }
      }
    });
    
    if (Object.keys(validationErrors).length > 0) {
      const errorFields = Object.keys(validationErrors).join(', ');
      setJsonErrors(validationErrors);
      alert(`Please fix JSON errors in the following fields before saving: ${errorFields}`);
      return;
    }
    
    setSaving(true);

    try {
      if (isEdit) {
        await contentCreatorsApi.update(id, formData);
        // Update initial data after successful save
        setInitialFormData({ ...formData });
        setInitialPhotoUrls([...photoUrls]);
        setInitialProofs([...proofs]);
        router.push('/content-creators');
      } else {
        const created = await contentCreatorsApi.create(formData);
        setCreatedId(created.id);
        
        // Перенаправляем на страницу редактирования
        router.push(`/content-creators/${created.id}`);
      }
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.message || 'Failed to save content creator');
    } finally {
      setSaving(false);
    }
  };

  const updateArrayField = (field: keyof CreateContentCreatorDto, value: string) => {
    const current = (formData[field] as string[]) || [];
    if (value && !current.includes(value)) {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const removeArrayItem = (field: keyof CreateContentCreatorDto, index: number) => {
    const current = (formData[field] as string[]) || [];
    setFormData({ ...formData, [field]: current.filter((_, i) => i !== index) });
  };

  // Early return if this is the submissions route
  if (id === 'submissions') {
    return null; // Component will redirect via useEffect
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
            {/* Fixed Header */}
            <div 
              style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'var(--bg-primary)',
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--border)',
                maxWidth: '1200px',
                margin: '0 auto',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleNavigation('/')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  ← Home
                </button>
                <button
                  onClick={() => handleNavigation('/content-creators')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  ← Back to List
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    {isEdit ? 'Edit' : 'Create'} Content Creator
                  </h1>
                  <div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Name:
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      color: 'var(--text-primary)', 
                      fontWeight: '500',
                      minHeight: '1.5rem',
                      fontStyle: formData.name?.[editLanguage] ? 'normal' : 'italic',
                    }}>
                      {formData.name?.[editLanguage] || 'Not set'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      Edit Language:
                    </label>
                    <select
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value as Language)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="en">English</option>
                      <option value="ua">Українська</option>
                      <option value="ru">Русский</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleNavigation('/content-creators')}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="content-creator-form"
                      disabled={saving}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: saving 
                          ? 'var(--text-muted)' 
                          : hasChanges() 
                            ? 'var(--success)' 
                            : 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'background 0.2s',
                      }}
                    >
                      {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for fixed header */}
            <div style={{ height: '180px' }}></div>

            <form id="content-creator-form" onSubmit={handleSubmit}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '2rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* Basic Info */}
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
                    Basic Information
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* ID and Locale in one row, 2 columns */}
                    {isEdit && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          ID
                        </label>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                          {id}
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                        Locale
                      </label>
                      <input
                        type="text"
                        value={formData.locale}
                        onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                    
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                        Name * (i18n)
                      </label>
                <input
                  type="text"
                  value={formData.name?.[editLanguage] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    name: { 
                      ...formData.name, 
                      [editLanguage]: e.target.value 
                    } 
                  })}
                  required
                  placeholder={`Enter name in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Switch language to edit translations for other languages
                </p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Quote (i18n)
                </label>
                <textarea
                  value={formData.quote?.[editLanguage] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    quote: { 
                      ...(formData.quote || createI18nText()), 
                      [editLanguage]: e.target.value 
                    } 
                  })}
                  placeholder={`Enter quote in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Description (i18n)
                </label>
                <textarea
                  value={formData.description?.[editLanguage] || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    description: { 
                      ...(formData.description || createI18nText()), 
                      [editLanguage]: e.target.value 
                    } 
                  })}
                  placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Photos (max 4)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  {photoUrls.map((photoUrl, index) => (
                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${photoUrl}`}
                        alt={`${getI18nText(formData.name, 'ua')} - Photo ${index + 1}`}
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(220, 38, 38, 0.9)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          lineHeight: '1',
                          padding: 0,
                          fontWeight: 'bold',
                        }}
                        title="Remove photo"
                      >
                        −
                      </button>
                      {uploadingPhotoIndex === index && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.875rem',
                          }}
                        >
                          Uploading...
                        </div>
                      )}
                    </div>
                  ))}
                  {photoUrls.length < 4 && (
                    <label
                      style={{
                        width: '150px',
                        height: '150px',
                        border: '2px dashed var(--border)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (isEdit || createdId) && uploadingPhotoIndex === null ? 'pointer' : 'not-allowed',
                        background: (isEdit || createdId) && uploadingPhotoIndex === null ? 'var(--bg-secondary)' : 'var(--bg-input)',
                        opacity: (isEdit || createdId) && uploadingPhotoIndex === null ? 1 : 0.6,
                        fontSize: '2rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handlePhotoSelect}
                        disabled={!isEdit && !createdId || uploadingPhotoIndex !== null}
                        style={{ display: 'none' }}
                      />
                      +
                    </label>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP. Maximum 4 photos allowed.
                </p>
              </div>
            </div>
          </div>

          {/* Rating and Status Section */}
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
              Rating & Status
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Rating (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rating || ''}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseInt(e.target.value) : undefined })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories, Tags & Ratios Section */}
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
              Categories, Tags & Ratios
            </h2>
            
            {/* Categories */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Categories
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(true);
                    setCategoryForm({ name: createI18nText(), description: createI18nText() });
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                  }}
                >
                  + Add Category
                </button>
              </div>
            <select
              multiple
              value={formData.categoryIds || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, categoryIds: selected });
              }}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getI18nText(category.name, 'ua')}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Hold Ctrl/Cmd to select multiple categories
            </p>
          </div>

            {/* Tags */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Tags
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowTagModal(true);
                    setTagForm({ name: createI18nText(), description: createI18nText() });
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                  }}
                >
                  + Add Tag
                </button>
              </div>
            <select
              multiple
              value={formData.tagIds || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, tagIds: selected });
              }}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {getI18nText(tag.name, 'ua')}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Hold Ctrl/Cmd to select multiple tags
            </p>
          </div>

            {/* Ratios */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Ratios
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowRatioModal(true);
                    setRatioForm({ name: createI18nText(), description: createI18nText() });
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                  }}
                >
                  + Add Ratio
                </button>
              </div>
            <select
              value={formData.ratioId || ''}
              onChange={(e) => {
                setFormData({ ...formData, ratioId: e.target.value || undefined });
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="">Select a ratio...</option>
              {ratios.length === 0 ? (
                <option disabled>No ratios available. Create ratios first.</option>
              ) : (
                ratios.map((ratio) => (
                  <option key={ratio.id} value={ratio.id}>
                    {getI18nText(ratio.name, editLanguage)}
                  </option>
                ))
              )}
            </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {ratios.length === 0 
                  ? 'No ratios available. Click "+ Add Ratio" to create one.'
                  : 'Select a single ratio'}
              </p>
            </div>
          </div>

          {/* Platforms Section */}
          {isEdit && id !== 'new' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Platforms</h2>
                <button
                  type="button"
                  onClick={handleAddPlatform}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  + Add Platform
                </button>
              </div>

              {/* Platform Modal */}
              {showPlatformModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowPlatformModal(false);
                    setEditingPlatformId(null);
                    setPlatformForm({ platformId: '', url: '', description: createI18nText() });
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      minWidth: '400px',
                      maxWidth: '90%',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                      {editingPlatformId ? 'Edit Platform' : 'Add Platform'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Platform *
                        </label>
                        <select
                          value={platformForm.platformId}
                          onChange={(e) => setPlatformForm({ ...platformForm, platformId: e.target.value })}
                          required
                          disabled={!!editingPlatformId}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: editingPlatformId ? 'var(--bg-secondary)' : 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            cursor: editingPlatformId ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <option value="">Select platform...</option>
                          {platforms.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {getI18nText(platform.name, editLanguage)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          URL *
                        </label>
                        <input
                          type="url"
                          value={platformForm.url}
                          onChange={(e) => setPlatformForm({ ...platformForm, url: e.target.value })}
                          required
                          placeholder="https://example.com"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (i18n)
                        </label>
                        <textarea
                          value={platformForm.description?.[editLanguage] || ''}
                          onChange={(e) => setPlatformForm({ 
                            ...platformForm, 
                            description: { 
                              ...(platformForm.description || createI18nText()), 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPlatformModal(false);
                            setEditingPlatformId(null);
                            setPlatformForm({ platformId: '', url: '', description: createI18nText() });
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitPlatform}
                          disabled={savingPlatform || !platformForm.platformId || !platformForm.url}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: savingPlatform ? 'var(--text-muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: savingPlatform ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          {savingPlatform ? 'Saving...' : editingPlatformId ? 'Update Platform' : 'Add Platform'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {contentCreatorPlatforms.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No platforms added yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {contentCreatorPlatforms.map((cp) => (
                    <div
                      key={cp.id}
                      style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Platform: </strong>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {getI18nText(cp.platform.name, editLanguage)}
                          </span>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>URL: </strong>
                          <a href={cp.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                            {cp.url}
                          </a>
                        </div>
                        {cp.description && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description: </strong>
                            <span style={{ fontSize: '0.875rem' }}>{getI18nText(cp.description, editLanguage)}</span>
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          Created: {new Date(cp.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEditPlatform(cp)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlatform(cp.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--error)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Piter Test Section */}
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
              Piter Test
            </h2>
            
            {/* Piter Test Block - объединенный блок для Value и Proofs */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}>
              {/* Piter Test Value Selection */}
              <div style={{ marginBottom: isEdit && id !== 'new' ? '2rem' : '0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Value
                </label>
                <select
                  value={formData.piterTest || ''}
                  onChange={(e) => setFormData({ ...formData, piterTest: e.target.value || undefined })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Not set</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              {/* Piter Test Proofs Section */}
              {isEdit && id !== 'new' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Proofs</h3>
                    <button
                      type="button"
                      onClick={handleAddPiterTestProof}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      }}
                    >
                      + Add Proof
                    </button>
                  </div>

              {/* Piter Test Proof Modal */}
              {showPiterTestProofModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowPiterTestProofModal(false);
                    setEditingPiterTestProofId(null);
                    setPiterTestProofForm({ url: '', imageUrl: '', description: createI18nText() });
                    setPiterTestProofImageFile(null);
                    setRemovePiterTestProofImage(false);
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      minWidth: '500px',
                      maxWidth: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                      {editingPiterTestProofId ? 'Edit Piter Test Proof' : 'Add Piter Test Proof'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          URL (optional)
                        </label>
                        <input
                          type="url"
                          value={piterTestProofForm.url}
                          onChange={(e) => setPiterTestProofForm({ ...piterTestProofForm, url: e.target.value })}
                          placeholder="https://example.com"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Image (optional)
                        </label>
                        {editingPiterTestProofId && piterTestProofForm.imageUrl && !piterTestProofImageFile && !removePiterTestProofImage && (
                          <div style={{ marginBottom: '0.5rem', position: 'relative', display: 'inline-block' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Current image:
                            </p>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={piterTestProofForm.imageUrl}
                                alt="Current proof"
                                style={{
                                  maxWidth: '200px',
                                  maxHeight: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border)',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setRemovePiterTestProofImage(true);
                                  setPiterTestProofForm({ ...piterTestProofForm, imageUrl: '' });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'rgba(0, 0, 0, 0.7)',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  lineHeight: '1',
                                  padding: 0,
                                }}
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        {piterTestProofImageFile && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', display: 'inline-block' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                                  New image selected: {piterTestProofImageFile.name}
                                </p>
                                {editingPiterTestProofId && piterTestProofForm.imageUrl && !removePiterTestProofImage && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                                    This will replace the current image
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPiterTestProofImageFile(null);
                                  const fileInput = e.currentTarget.closest('div')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                                  if (fileInput) fileInput.value = '';
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'rgba(0, 0, 0, 0.7)',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  lineHeight: '1',
                                  padding: 0,
                                }}
                                title="Remove selected image"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPiterTestProofImageFile(file);
                              setRemovePiterTestProofImage(false);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (i18n)
                        </label>
                        <textarea
                          value={piterTestProofForm.description?.[editLanguage] || ''}
                          onChange={(e) => setPiterTestProofForm({ 
                            ...piterTestProofForm, 
                            description: { 
                              ...(piterTestProofForm.description || createI18nText()), 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPiterTestProofModal(false);
                            setEditingPiterTestProofId(null);
                            setPiterTestProofForm({ url: '', imageUrl: '', description: createI18nText() });
                            setPiterTestProofImageFile(null);
                            setRemovePiterTestProofImage(false);
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitPiterTestProof}
                          disabled={savingPiterTestProof || uploadingPiterTestProofImage}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: (savingPiterTestProof || uploadingPiterTestProofImage) ? 'var(--text-muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: (savingPiterTestProof || uploadingPiterTestProofImage) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          {(savingPiterTestProof || uploadingPiterTestProofImage) ? 'Saving...' : editingPiterTestProofId ? 'Update Proof' : 'Add Proof'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {piterTestProofs.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No proofs added yet
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {piterTestProofs.map((proof) => (
                      <div
                        key={proof.id}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          {proof.url && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>URL: </strong>
                              <a href={proof.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                                {proof.url}
                              </a>
                            </div>
                          )}
                          {proof.imageUrl && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <img
                                src={proof.imageUrl}
                                alt="Proof"
                                style={{
                                  maxWidth: '150px',
                                  maxHeight: '150px',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border)',
                                }}
                              />
                            </div>
                          )}
                          {proof.description && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description: </strong>
                              <span style={{ fontSize: '0.875rem' }}>{getI18nText(proof.description, editLanguage)}</span>
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Created: {new Date(proof.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleEditPiterTestProof(proof)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'var(--accent)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePiterTestProof(proof.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'var(--error)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              )}
            </div>
          </div>

          {/* Content Formats Array */}
          {(['contentFormats'] as const).map((field) => (
            <div key={field}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize' }}>
                {field.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  placeholder={`Add ${field}...`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      updateArrayField(field, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(formData[field] as string[])?.map((item, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeArrayItem(field, index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: 0,
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Tone Slider */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Tone
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '30px' }}>
                -10
              </span>
              <input
                type="range"
                min="-10"
                max="10"
                value={formData.tone ?? 0}
                onChange={(e) => setFormData({ ...formData, tone: parseInt(e.target.value, 10) })}
                style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '30px' }}>
                +10
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  minWidth: '40px',
                  textAlign: 'center',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '0.25rem',
                }}
              >
                {formData.tone ?? 0}
              </span>
            </div>
          </div>


          {/* Proofs Section */}
          {isEdit && id !== 'new' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Proofs</h2>
                <button
                  type="button"
                  onClick={handleAddProof}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  + Add Proof
                </button>
              </div>
              
              {/* Proof Modal */}
              {showProofModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowProofModal(false);
                    setEditingProofId(null);
                    setProofForm({ url: '', imageUrl: '', description: createI18nText() });
                    setProofImageFile(null);
                    setRemoveProofImage(false);
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      minWidth: '400px',
                      maxWidth: '90%',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                      {editingProofId ? 'Edit Proof' : 'Add Proof'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          URL (optional)
                        </label>
                        <input
                          type="text"
                          value={proofForm.url}
                          onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                          placeholder="https://example.com/proof"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Image (optional)
                        </label>
                        {editingProofId && proofForm.imageUrl && !proofImageFile && !removeProofImage && (
                          <div style={{ marginBottom: '0.5rem', position: 'relative', display: 'inline-block' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Current image:
                            </p>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={proofForm.imageUrl}
                                alt="Current proof"
                                style={{
                                  maxWidth: '200px',
                                  maxHeight: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border)',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setRemoveProofImage(true);
                                  setProofForm({ ...proofForm, imageUrl: '' });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'rgba(0, 0, 0, 0.7)',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  lineHeight: '1',
                                  padding: 0,
                                }}
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        {proofImageFile && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', display: 'inline-block' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                                  New image selected: {proofImageFile.name}
                                </p>
                                {editingProofId && proofForm.imageUrl && !removeProofImage && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                                    This will replace the current image
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProofImageFile(null);
                                  // Сбрасываем input file для proof image
                                  const fileInput = e.currentTarget.closest('div')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                                  if (fileInput) fileInput.value = '';
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0.25rem',
                                  right: '0.25rem',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'rgba(0, 0, 0, 0.7)',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  lineHeight: '1',
                                  padding: 0,
                                }}
                                title="Remove selected image"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        {removeProofImage && editingProofId && (
                          <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                              Image will be removed on save
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleProofImageSelect}
                          disabled={uploadingProofImage}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            cursor: uploadingProofImage ? 'not-allowed' : 'pointer',
                          }}
                        />
                        {uploadingProofImage && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Uploading image...
                          </p>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                          Or enter Image URL manually:
                        </p>
                        <input
                          type="text"
                          value={proofForm.imageUrl}
                          onChange={(e) => setProofForm({ ...proofForm, imageUrl: e.target.value })}
                          placeholder="/uploads/proofs/image.jpg"
                          disabled={!!proofImageFile}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: proofImageFile ? 'var(--bg-secondary)' : 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            marginTop: '0.5rem',
                            opacity: proofImageFile ? 0.6 : 1,
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (i18n)
                        </label>
                        <textarea
                          value={proofForm.description?.[editLanguage] || ''}
                          onChange={(e) => setProofForm({ 
                            ...proofForm, 
                            description: { 
                              ...(proofForm.description || createI18nText()), 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProofModal(false);
                            setEditingProofId(null);
                            setProofForm({ url: '', imageUrl: '', description: createI18nText() });
                            setProofImageFile(null);
                            setRemoveProofImage(false);
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitProof}
                          disabled={uploadingProofImage}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: uploadingProofImage ? 'var(--text-muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: uploadingProofImage ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          {uploadingProofImage ? 'Uploading...' : editingProofId ? 'Update Proof' : 'Add Proof'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Modal */}
              {showCategoryModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryForm({ name: createI18nText(), description: createI18nText() });
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      minWidth: '400px',
                      maxWidth: '90%',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                      Create Category
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Name * (i18n)
                        </label>
                        <input
                          type="text"
                          value={categoryForm.name?.[editLanguage] || ''}
                          onChange={(e) => setCategoryForm({ 
                            ...categoryForm, 
                            name: { 
                              ...categoryForm.name, 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          required
                          placeholder={`Enter name in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (i18n)
                        </label>
                        <textarea
                          value={categoryForm.description?.[editLanguage] || ''}
                          onChange={(e) => setCategoryForm({ 
                            ...categoryForm, 
                            description: { 
                              ...(categoryForm.description || createI18nText()), 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategoryModal(false);
                            setCategoryForm({ name: createI18nText(), description: createI18nText() });
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={savingCategory || !categoryForm.name?.[editLanguage]}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: savingCategory ? 'var(--text-muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: savingCategory ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          {savingCategory ? 'Creating...' : 'Create Category'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tag Modal */}
              {showTagModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowTagModal(false);
                    setTagForm({ name: createI18nText(), description: createI18nText() });
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      minWidth: '400px',
                      maxWidth: '90%',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                      Create Tag
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Name * (i18n)
                        </label>
                        <input
                          type="text"
                          value={tagForm.name?.[editLanguage] || ''}
                          onChange={(e) => setTagForm({ 
                            ...tagForm, 
                            name: { 
                              ...tagForm.name, 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          required
                          placeholder={`Enter name in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (i18n)
                        </label>
                        <textarea
                          value={tagForm.description?.[editLanguage] || ''}
                          onChange={(e) => setTagForm({ 
                            ...tagForm, 
                            description: { 
                              ...(tagForm.description || createI18nText()), 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTagModal(false);
                            setTagForm({ name: createI18nText(), description: createI18nText() });
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateTag}
                          disabled={savingTag || !tagForm.name?.[editLanguage]}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: savingTag ? 'var(--text-muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: savingTag ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          {savingTag ? 'Creating...' : 'Create Tag'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ratio Modal */}
              {showRatioModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowRatioModal(false);
                    setRatioForm({ name: createI18nText(), description: createI18nText() });
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      minWidth: '400px',
                      maxWidth: '90%',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                      Create Ratio
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Name * (i18n)
                        </label>
                        <input
                          type="text"
                          value={ratioForm.name?.[editLanguage] || ''}
                          onChange={(e) => setRatioForm({ 
                            ...ratioForm, 
                            name: { 
                              ...ratioForm.name, 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          required
                          placeholder={`Enter name in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (i18n)
                        </label>
                        <textarea
                          value={ratioForm.description?.[editLanguage] || ''}
                          onChange={(e) => setRatioForm({ 
                            ...ratioForm, 
                            description: { 
                              ...(ratioForm.description || createI18nText()), 
                              [editLanguage]: e.target.value 
                            } 
                          })}
                          placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRatioModal(false);
                            setRatioForm({ name: createI18nText(), description: createI18nText() });
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateRatio}
                          disabled={savingRatio || !ratioForm.name?.[editLanguage]}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: savingRatio ? 'var(--text-muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: savingRatio ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          {savingRatio ? 'Creating...' : 'Create Ratio'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {proofs.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No proofs added yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {proofs.map((proof) => (
                    <div
                      key={proof.id}
                      style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {proof.imageUrl && (
                          <div style={{ flexShrink: 0 }}>
                            <img
                              src={proof.imageUrl}
                              alt="Proof"
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          {proof.url && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>URL: </strong>
                              <a href={proof.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>
                                {proof.url}
                              </a>
                            </div>
                          )}
                          {proof.description && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description: </strong>
                              <span style={{ fontSize: '0.875rem' }}>{getI18nText(proof.description, editLanguage)}</span>
                            </div>
                          )}
                          {proof.imageUrl && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Image URL: </strong>
                              <a href={proof.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                                {proof.imageUrl}
                              </a>
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Created: {new Date(proof.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEditProof(proof.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProof(proof.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--error)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Proof Submissions Review Section */}
          {isEdit && id !== 'new' && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Proof Submissions Review</h2>
              </div>
              
              {proofSubmissions.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No proof submissions to review
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {proofSubmissions.map((submission) => {
                    const statusDisplay: 'submitted' | 'in_review' | 'accepted' | 'declined' = submission.currentStatus || 'submitted';
                    const submitterInfo = submission.user
                      ? `${submission.user.firstName || ''} ${submission.user.lastName || ''} (${submission.user.email})`
                      : submission.anonymousSession
                        ? `Anonymous (${submission.anonymousSession.submitterId.substring(0, 8)}...)`
                        : 'Unknown';
                    
                    return (
                      <div
                        key={submission.id}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          {submission.imageUrl && (
                            <div style={{ flexShrink: 0 }}>
                              <img
                                src={submission.imageUrl}
                                alt="Proof submission"
                                style={{
                                  width: '120px',
                                  height: '120px',
                                  objectFit: 'cover',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border)',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status: </strong>
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  textTransform: 'uppercase',
                                  background:
                                    statusDisplay === 'accepted'
                                      ? 'rgba(16, 185, 129, 0.125)'
                                      : statusDisplay === 'declined'
                                        ? 'rgba(239, 68, 68, 0.125)'
                                        : statusDisplay === 'in_review'
                                          ? 'rgba(251, 146, 60, 0.125)'
                                          : 'rgba(99, 102, 241, 0.125)',
                                  color:
                                    statusDisplay === 'accepted'
                                      ? '#10b981'
                                      : statusDisplay === 'declined'
                                        ? '#ef4444'
                                        : statusDisplay === 'in_review'
                                          ? '#fb923c'
                                          : '#6366f1',
                                  border: `1px solid ${
                                    statusDisplay === 'accepted'
                                      ? '#10b981'
                                      : statusDisplay === 'declined'
                                        ? '#ef4444'
                                        : statusDisplay === 'in_review'
                                          ? '#fb923c'
                                          : '#6366f1'
                                  }`,
                                }}
                              >
                                {statusDisplay === 'accepted' 
                                  ? '✓ Accepted' 
                                  : statusDisplay === 'declined' 
                                    ? '✗ Declined' 
                                    : statusDisplay === 'in_review'
                                      ? '⏳ In Review'
                                      : '📤 Submitted'}
                              </span>
                            </div>
                            {submission.url && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>URL: </strong>
                                <a href={submission.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>
                                  {submission.url}
                                </a>
                              </div>
                            )}
                            {submission.description && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description: </strong>
                                <span style={{ fontSize: '0.875rem' }}>{getI18nText(submission.description, editLanguage)}</span>
                              </div>
                            )}
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Submitted by: </strong>
                              <span style={{ fontSize: '0.875rem' }}>{submitterInfo}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                              Created: {new Date(submission.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateProofSubmissionStatus(submission.id, 'submitted')}
                            disabled={statusDisplay === 'submitted'}
                            style={{
                              padding: '0.5rem 1rem',
                              background: statusDisplay === 'submitted' ? 'var(--text-muted)' : '#6366f1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: statusDisplay === 'submitted' ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              opacity: statusDisplay === 'submitted' ? 0.6 : 1,
                            }}
                          >
                            📤 Submitted
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateProofSubmissionStatus(submission.id, 'in_review')}
                            disabled={statusDisplay === 'in_review'}
                            style={{
                              padding: '0.5rem 1rem',
                              background: statusDisplay === 'in_review' ? 'var(--text-muted)' : '#fb923c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: statusDisplay === 'in_review' ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              opacity: statusDisplay === 'in_review' ? 0.6 : 1,
                            }}
                          >
                            In Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateProofSubmissionStatus(submission.id, 'accepted')}
                            disabled={statusDisplay === 'accepted'}
                            style={{
                              padding: '0.5rem 1rem',
                              background: statusDisplay === 'accepted' ? 'var(--text-muted)' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: statusDisplay === 'accepted' ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              opacity: statusDisplay === 'accepted' ? 0.6 : 1,
                            }}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateProofSubmissionStatus(submission.id, 'declined')}
                            disabled={statusDisplay === 'declined'}
                            style={{
                              padding: '0.5rem 1rem',
                              background: statusDisplay === 'declined' ? 'var(--text-muted)' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: statusDisplay === 'declined' ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              opacity: statusDisplay === 'declined' ? 0.6 : 1,
                            }}
                          >
                            ✗ Decline
                          </button>
                          <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
                          <button
                            type="button"
                            onClick={() => handleDeleteProofSubmission(submission.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                            }}
                            title="Permanently delete this proof submission (will also be removed from user's view)"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Additional Data (JSON) - Moved to bottom */}
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
              Additional Data (JSON)
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              For complex fields (audience, metrics), use JSON format. These will be saved as-is.
            </p>
            {Object.values(jsonErrors).some(error => error !== undefined) && (
              <div style={{
                padding: '1rem',
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: 'var(--error)',
                  fontWeight: '500',
                }}>
                  ⚠️ Please fix JSON errors in the fields below before saving. The form cannot be saved with invalid JSON.
                </p>
              </div>
            )}
            {(['audience', 'metrics'] as const).map((field) => {
              // Use local state for JSON text, fallback to formData if not set
              const fieldValue = formData[field];
              const defaultJsonString = fieldValue ? JSON.stringify(fieldValue, null, 2) : '{}';
              const jsonString = jsonTexts[field] !== undefined ? jsonTexts[field]! : defaultJsonString;
              const error = jsonErrors[field];
              
              return (
                <div key={field} style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize' }}>
                    {field}
                  </label>
                  <textarea
                    value={jsonString}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Always update the text state to allow free editing
                      setJsonTexts({ ...jsonTexts, [field]: value });
                      
                      // Try to parse and update formData if valid
                      try {
                        const parsed = value.trim() === '' ? {} : JSON.parse(value);
                        setFormData({ ...formData, [field]: parsed });
                        setJsonErrors({ ...jsonErrors, [field]: undefined });
                      } catch (err) {
                        // Invalid JSON - show error but allow editing
                        setJsonErrors({ ...jsonErrors, [field]: err instanceof Error ? err.message : 'Invalid JSON' });
                      }
                    }}
                    onBlur={(e) => {
                      // Try to parse on blur to validate and update formData
                      try {
                        const value = e.target.value.trim();
                        if (value === '') {
                          setFormData({ ...formData, [field]: {} });
                          setJsonTexts({ ...jsonTexts, [field]: '{}' });
                          setJsonErrors({ ...jsonErrors, [field]: undefined });
                        } else {
                          const parsed = JSON.parse(value);
                          setFormData({ ...formData, [field]: parsed });
                          // Update text to formatted version
                          setJsonTexts({ ...jsonTexts, [field]: JSON.stringify(parsed, null, 2) });
                          setJsonErrors({ ...jsonErrors, [field]: undefined });
                        }
                      } catch (err) {
                        // Keep error state and text as is
                      }
                    }}
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      padding: '0.75rem',
                      border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
                      borderRadius: '0.5rem',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      lineHeight: '1.5',
                      resize: 'vertical',
                    }}
                    placeholder={`Enter valid JSON for ${field}...`}
                  />
                  {error && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--error)', 
                      marginTop: '0.5rem',
                      marginBottom: 0,
                    }}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </form>
    </div>
  );
}
