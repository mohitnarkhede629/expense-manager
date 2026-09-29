package com.expensemanager.api.repository;

import com.expensemanager.api.model.Category;
import com.expensemanager.api.model.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdOrIsSystemTrue(Long userId);
    List<Category> findByCategoryType(CategoryType categoryType);
}
